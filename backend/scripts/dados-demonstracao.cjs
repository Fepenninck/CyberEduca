const { createHash } = require('node:crypto');

const REVISION = 'tcc-demo-v1';
const DOMAIN = 'demo.cybereduca.invalid';
const DAY = 86400000;
const LEVELS = ['BASICO', 'INTERMEDIARIO', 'AVANCADO'];
const RETIRED_TRACK = '4328594b-f7cb-52d2-862f-e612b1647aa9';
const EXAMS = {
  BASICO: 'ce000000-0000-4000-9001-000000000001',
  INTERMEDIARIO: 'ce000000-0000-4000-9001-000000000002',
  AVANCADO: 'ce000000-0000-4000-9001-000000000003',
};
const FIRST_NAMES = ['Ana', 'Bruno', 'Camila', 'Daniel', 'Elisa', 'Felipe', 'Gabriela', 'Hugo', 'Isabela', 'João', 'Larissa', 'Marcos', 'Natália', 'Otávio', 'Paula', 'Rafael', 'Sofia', 'Tiago', 'Valéria', 'Vinícius'];
const LAST_NAMES = ['Almeida', 'Barbosa', 'Costa', 'Dias', 'Ferreira', 'Gomes', 'Lima', 'Martins', 'Oliveira', 'Pereira', 'Ribeiro', 'Santos', 'Silva', 'Souza', 'Teixeira'];
const TABLES = ['usuario', 'progressoAula', 'tentativaProva', 'respostaProva', 'resultadoProva', 'tentativaQuiz', 'respostaQuiz', 'resultadoSimulacao', 'tentativaPhishing', 'logAuditoria'];

function id(key) {
  const hex = createHash('sha256').update(`${REVISION}:${key}`).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function randomFor(index) {
  let state = (index * 2654435761) >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function answerable(questions, correctKey) {
  return questions.length > 0 && questions.every(question =>
    question.alternativas.some(answer => answer[correctKey]) &&
    question.alternativas.some(answer => !answer[correctKey]));
}

async function loadCatalog(db) {
  const [lessons, exams, quizzes, simulations, phishing] = await Promise.all([
    db.aula.findMany({ where: { trilhaId: { not: RETIRED_TRACK } }, orderBy: [{ trilha: { ordem: 'asc' } }, { ordem: 'asc' }, { id: 'asc' }], select: { id: true, trilha: { select: { nivel: true } } } }),
    db.prova.findMany({ where: { id: { in: Object.values(EXAMS) }, status: 'PUBLICADO' }, include: { questoes: { orderBy: { ordem: 'asc' }, include: { alternativas: { orderBy: { ordem: 'asc' } } } } } }),
    db.quiz.findMany({ where: { status: 'PUBLICADO', aula: { trilhaId: { not: RETIRED_TRACK } } }, orderBy: { id: 'asc' }, include: { questoes: { orderBy: { ordem: 'asc' }, include: { alternativas: { orderBy: { ordem: 'asc' } } } } } }),
    db.simulacao.findMany({ orderBy: { id: 'asc' }, include: { questoes: { orderBy: { ordem: 'asc' }, include: { alternativas: { orderBy: { ordem: 'asc' } } } } } }),
    db.cenarioPhishing.findMany({ where: { status: 'PUBLICADO', aula: { trilhaId: { not: RETIRED_TRACK } } }, orderBy: { id: 'asc' } }),
  ]);
  const levels = LEVELS.map(nivel => {
    const aulas = lessons.filter(lesson => lesson.trilha.nivel === nivel);
    const exam = exams.find(item => item.id === EXAMS[nivel]);
    const questions = aulas.map(lesson => exam?.questoes.filter(question => question.explicacao.startsWith(`[aula:${lesson.id}]`)) ?? []);
    if (!aulas.length || questions.some(variants => variants.length < 2 || !answerable(variants, 'isCorreta'))) {
      throw new Error(`Catálogo incompleto para demonstração no nível ${nivel}; nenhuma carga foi iniciada.`);
    }
    return { nivel, aulas, provaId: exam.id, questions };
  });
  const validQuizzes = quizzes.filter(quiz => answerable(quiz.questoes, 'correta'));
  const validSimulations = simulations.filter(simulation => answerable(simulation.questoes, 'isCorreta'));
  if (!validQuizzes.length || !validSimulations.length) throw new Error('São necessários quizzes e simulações válidos antes da carga.');
  return { levels, quizzes: validQuizzes, simulations: validSimulations, phishing };
}

function chooseAnswers(questions, correctKey, fraction, random) {
  const count = Math.max(0, Math.min(questions.length, Math.round(questions.length * fraction)));
  const order = questions.map((question, index) => ({ index, weight: random() })).sort((a, b) => a.weight - b.weight);
  const correct = new Set(order.slice(0, count).map(item => item.index));
  return questions.map((question, index) => {
    const options = question.alternativas.filter(answer => Boolean(answer[correctKey]) === correct.has(index));
    return { question, answer: options[Math.floor(random() * options.length)], correct: correct.has(index) };
  });
}

function planUser(index, catalog, now) {
  const random = randomFor(index);
  const usuarioId = id(`user:${index}`);
  const reference = now.getTime();
  // Cadastros ocupam 180 dias; o último dia é anterior à execução, sem datas futuras.
  const created = new Date(reference - (1 + Math.floor(random() * 180)) * DAY + Math.floor(random() * DAY / 2));
  const end = created.getTime() + (reference - created.getTime()) * (0.35 + random() * 0.65);
  const rows = Object.fromEntries(TABLES.map(table => [table, []]));
  rows.usuario.push({ id: usuarioId, nome: `[DEMO] ${FIRST_NAMES[index % FIRST_NAMES.length]} ${LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length]} ${String(index).padStart(4, '0')}`, email: `aluno${String(index).padStart(4, '0')}@${DOMAIN}`, papel: 'USUARIO', criadoEm: created, atualizadoEm: created, senhaHash: null });
  const audit = (key, acao, entidade, entidadeId, date) => ({ id: id(`${usuarioId}:audit:${key}`), acao, entidade, entidadeId, atorId: usuarioId, criadoEm: date, sucesso: true, detalhes: { demonstracao: true, origem: REVISION, registroSintetico: true } });
  rows.logAuditoria.push(audit('cadastro', 'CADASTRO', 'Usuario', usuarioId, created));
  const profile = index % 100;
  if (profile < 15) return rows;
  // 15% sem atividade; 25% básico parcial; 15% básico reprovado;
  // 25% intermediário parcial; 15% avançado parcial; 5% todos os níveis.
  const finalLevel = profile < 55 ? 0 : profile < 80 ? 1 : 2;
  const failed = profile >= 40 && profile < 55;
  const completed = profile >= 95;
  const events = [];
  const studiedLessons = new Set();
  let quizzesAdded = 0;
  for (let levelIndex = 0; levelIndex <= finalLevel; levelIndex++) {
    const level = catalog.levels[levelIndex];
    const full = levelIndex < finalLevel || failed || completed;
    const count = full ? level.aulas.length : Math.max(1, Math.floor(level.aulas.length * (0.1 + random() * 0.75)));
    for (const lesson of level.aulas.slice(0, count)) {
      studiedLessons.add(lesson.id);
      events.push(date => {
        const progressId = id(`${usuarioId}:lesson:${lesson.id}`);
        rows.progressoAula.push({ id: progressId, usuarioId, aulaId: lesson.id, concluida: true, dataConclusao: date });
        rows.logAuditoria.push(audit(lesson.id, 'CONCLUIR_AULA', 'Aula', lesson.id, date));
      });
      const availableQuizzes = catalog.quizzes.filter(quiz => quiz.aulaId === lesson.id);
      if (quizzesAdded < 4 && availableQuizzes.length && random() < 0.3) {
        const quiz = availableQuizzes[Math.floor(random() * availableQuizzes.length)];
        const answers = chooseAnswers(quiz.questoes, 'correta', 0.2 + random() * 0.8, random);
        quizzesAdded++;
        events.push(date => {
          const tentativaId = id(`${usuarioId}:quiz:${quiz.id}`);
          rows.tentativaQuiz.push({ id: tentativaId, usuarioId, quizId: quiz.id, totalQuestoes: answers.length, totalAcertos: answers.filter(item => item.correct).length, concluidoEm: date });
          rows.respostaQuiz.push(...answers.map(item => ({ id: id(`${tentativaId}:${item.question.id}`), tentativaId, questaoId: item.question.id, alternativaId: item.answer.id, acertou: item.correct })));
        });
      }
    }
    if (full) {
      const questions = level.questions.map(variants => variants[Math.floor(random() * variants.length)]);
      const answers = chooseAnswers(questions, 'isCorreta', failed ? 0.2 + random() * 0.3 : 0.65 + random() * 0.35, random);
      // Início e término são eventos distintos, posteriores à última aula.
      let started;
      events.push(date => { started = date; });
      events.push(date => {
        const tentativaId = id(`${usuarioId}:exam:${level.provaId}`);
        const hits = answers.filter(item => item.correct).length;
        rows.tentativaProva.push({ id: tentativaId, usuarioId, provaId: level.provaId, totalQuestoes: answers.length, totalAcertos: hits, nota: hits / answers.length * 10, iniciadoEm: new Date(Math.max(started.getTime(), date.getTime() - 15 * 60000)), concluidoEm: date });
        rows.respostaProva.push(...answers.map(item => ({ id: id(`${tentativaId}:${item.question.id}`), tentativaId, questaoId: item.question.id, alternativaId: item.answer.id, acertou: item.correct })));
        rows.resultadoProva.push({ id: id(`${tentativaId}:result`), usuarioId, provaId: level.provaId, totalQuestoes: answers.length, acertos: hits, criadoEm: date });
      });
    }
  }
  const availableSimulations = catalog.simulations.filter(simulation => LEVELS.indexOf(simulation.nivel) <= finalLevel);
  const selectedSimulations = availableSimulations.map(simulation => ({ simulation, weight: random() })).sort((a, b) => a.weight - b.weight).slice(0, 1 + Math.floor(random() * 4));
  for (const { simulation } of selectedSimulations) {
    const answers = chooseAnswers(simulation.questoes, 'isCorreta', random(), random);
    events.push(date => rows.resultadoSimulacao.push({ id: id(`${usuarioId}:simulation:${simulation.id}`), usuarioId, simulacaoId: simulation.id, acertos: answers.filter(item => item.correct).length, totalQuestoes: answers.length, criadoEm: date, respostas: answers.map(item => ({ questaoId: item.question.id, enunciado: item.question.enunciado, contexto: item.question.contexto, explicacao: item.question.explicacao, textoEscolhido: item.answer.texto, alternativaEscolhidaId: item.answer.id, correta: item.correct, alternativaCorretaId: item.question.alternativas.find(answer => answer.isCorreta).id, textoCorreto: item.question.alternativas.find(answer => answer.isCorreta).texto })) }));
  }
  const availableScenarios = catalog.phishing.filter(item => studiedLessons.has(item.aulaId));
  const scenario = availableScenarios[index % Math.max(1, availableScenarios.length)];
  if (scenario) {
    const correct = random() > 0.3;
    events.push(date => rows.tentativaPhishing.push({ id: id(`${usuarioId}:phishing:${scenario.id}`), usuarioId, cenarioId: scenario.id, respostaEhPhishing: correct ? scenario.ehPhishing : !scenario.ehPhishing, acertou: correct, concluidoEm: date }));
  }
  const start = created.getTime();
  events.forEach((event, position) => event(new Date(start + (end - start) * (position + 1) / (events.length + 1))));
  const sessions = 2 + Math.floor(random() * 8);
  for (let session = 0; session < sessions; session++) {
    rows.logAuditoria.push(audit(`login:${session}`, 'LOGIN', 'Usuario', usuarioId, new Date(start + (end - start) * session / sessions)));
  }
  rows.usuario[0].atualizadoEm = new Date(end);
  return rows;
}

async function insertRows(tx, plans) {
  for (const table of TABLES) {
    const records = plans.flatMap(plan => plan[table]);
    for (let offset = 0; offset < records.length; offset += 500) {
      await tx[table].createMany({ data: records.slice(offset, offset + 500) });
    }
  }
}

async function seedDemo(db, { apply = false, target = 1000, now = new Date(), report = console.log } = {}) {
  if (!Number.isInteger(target) || target < 1 || target > 10000 || !Number.isFinite(now.getTime())) throw new Error('Parâmetros de carga inválidos.');
  const studentWhere = { papel: { in: ['USUARIO', 'ALUNO'] } };
  const demoWhere = { email: { endsWith: `@${DOMAIN}` } };
  const before = await db.usuario.count({ where: studentWhere });
  const missing = Math.max(0, target - before);
  report(JSON.stringify({ modo: apply ? 'aplicar' : 'planejar', alunosExistentes: before, metaAlunos: target, faltantes: missing, origem: REVISION, dadosSinteticos: true }));
  if (!missing) return { before, created: 0, after: before };
  const catalog = await loadCatalog(db);
  const occupied = await db.usuario.findMany({ where: demoWhere, select: { email: true } });
  const used = new Set(occupied.map(user => user.email));
  const plans = [];
  for (let index = 1; plans.length < missing; index++) {
    const email = `aluno${String(index).padStart(4, '0')}@${DOMAIN}`;
    if (!used.has(email)) plans.push(planUser(index, catalog, now));
  }
  const totals = Object.fromEntries(TABLES.map(table => [table, plans.reduce((count, plan) => count + plan[table].length, 0)]));
  report(JSON.stringify({ registrosPlanejados: totals, periodoCadastros: { inicio: new Date(now.getTime() - 180 * DAY).toISOString(), fim: now.toISOString() } }));
  if (!apply) return { before, created: 0, after: before, planned: totals };
  let created = 0;
  for (let offset = 0; offset < plans.length; offset += 25) {
    const batch = plans.slice(offset, offset + 25);
    const count = await db.$transaction(async tx => {
      // Serializa builds concorrentes. Usuário e atividades são gravados atomicamente.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(20261122, 1000)`;
      const current = await tx.usuario.count({ where: studentWhere });
      const emails = batch.map(plan => plan.usuario[0].email);
      const existing = new Set((await tx.usuario.findMany({ where: { email: { in: emails } }, select: { email: true } })).map(user => user.email));
      const selected = batch.filter(plan => !existing.has(plan.usuario[0].email)).slice(0, Math.max(0, target - current));
      await insertRows(tx, selected);
      return selected.length;
    }, { timeout: 120000, maxWait: 30000 });
    created += count;
    report(`[demonstração] ${created} alunos criados nesta execução; lote ${Math.floor(offset / 25) + 1}/${Math.ceil(plans.length / 25)}.`);
  }
  const after = await db.usuario.count({ where: studentWhere });
  if (after < target) throw new Error('A meta não foi alcançada; execute novamente para retomar os lotes pendentes.');
  report(JSON.stringify({ alunosAntes: before, alunosCriados: created, alunosDepois: after, dadosSinteticos: true }));
  return { before, created, after };
}

module.exports = { seedDemo, loadCatalog, planUser, id, DOMAIN, REVISION, TABLES, EXAMS, DAY };
