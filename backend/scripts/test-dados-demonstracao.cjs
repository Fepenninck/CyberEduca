const assert = require('node:assert/strict');
const { test } = require('node:test');
const { planUser, TABLES, EXAMS, DAY } = require('./dados-demonstracao.cjs');
const { main: production } = require('./seed-demonstracao-producao.cjs');

function fixture() {
  const levels = Object.entries(EXAMS).map(([nivel, provaId]) => {
    const aulas = Array.from({ length: 10 }, (_, index) => ({ id: `${nivel}-aula-${index}`, trilha: { nivel } }));
    const questions = aulas.map(lesson => [0, 1].map(variant => ({ id: `${lesson.id}-${variant}`, alternativas: [{ id: `${lesson.id}-${variant}-c`, isCorreta: true }, { id: `${lesson.id}-${variant}-e`, isCorreta: false }] })));
    return { nivel, provaId, aulas, questions };
  });
  return {
    levels,
    quizzes: levels.flatMap(level => level.aulas.map(lesson => ({ id: `quiz-${lesson.id}`, aulaId: lesson.id, questoes: [{ id: `question-${lesson.id}`, alternativas: [{ id: `qc-${lesson.id}`, correta: true }, { id: `qe-${lesson.id}`, correta: false }] }] }))),
    simulations: levels.map(level => ({ id: `sim-${level.nivel}`, nivel: level.nivel, questoes: [{ id: `sq-${level.nivel}`, enunciado: 'Cenário fictício', contexto: '', explicacao: '', alternativas: [{ id: `sc-${level.nivel}`, isCorreta: true, texto: 'Correta' }, { id: `se-${level.nivel}`, isCorreta: false, texto: 'Incorreta' }] }] })),
    phishing: [{ id: 'phishing', aulaId: levels[0].aulas[0].id, ehPhishing: true }],
  };
}

const now = new Date('2026-11-22T18:00:00-03:00');
const catalog = fixture();

test('mil usuários sintéticos, IDs únicos, sem credenciais e com cadastros espalhados', () => {
  const plans = Array.from({ length: 1000 }, (_, index) => planUser(index + 1, catalog, now));
  const users = plans.flatMap(plan => plan.usuario);
  assert.equal(new Set(users.map(user => user.email)).size, 1000);
  assert.equal(new Set(users.map(user => user.criadoEm.toISOString().slice(0, 10))).size > 150, true);
  assert.equal(users.every(user => user.nome.startsWith('[DEMO]') && user.email.endsWith('.invalid') && user.senhaHash === null), true);
  for (const table of TABLES) {
    const ids = plans.flatMap(plan => plan[table].map(row => row.id));
    assert.equal(new Set(ids).size, ids.length, `IDs duplicados: ${table}`);
  }
  const activeDays = new Set(plans.flatMap(plan => plan.progressoAula.map(row => row.dataConclusao.toISOString().slice(0, 10))));
  assert.ok(activeDays.size > 150);
  assert.ok(plans.some(plan => plan.resultadoProva.some(row => row.criadoEm.getTime() >= now.getTime() - 7 * DAY)));
});

test('cronologia, respostas e critérios de avanço permanecem consistentes', () => {
  const questionMap = new Map(catalog.levels.flatMap(level => level.questions.flat().map(question => [question.id, question])));
  for (let index = 1; index <= 100; index++) {
    const plan = planUser(index, catalog, now);
    const user = plan.usuario[0];
    for (const table of TABLES) {
      for (const row of plan[table]) {
        for (const [key, value] of Object.entries(row)) {
          if (value instanceof Date) assert.ok(value >= user.criadoEm && value <= now, `${table}.${key} fora do período`);
        }
      }
    }
    for (const attempt of plan.tentativaProva) {
      assert.ok(attempt.iniciadoEm <= attempt.concluidoEm);
      assert.ok(attempt.concluidoEm - attempt.iniciadoEm <= 15 * 60000);
      const level = catalog.levels.find(item => item.provaId === attempt.provaId);
      const answers = plan.respostaProva.filter(answer => answer.tentativaId === attempt.id);
      assert.equal(answers.length, level.aulas.length);
      assert.equal(answers.filter(answer => answer.acertou).length, attempt.totalAcertos);
      for (const answer of answers) {
        const option = questionMap.get(answer.questaoId).alternativas.find(item => item.id === answer.alternativaId);
        assert.equal(option.isCorreta, answer.acertou);
      }
      for (const lesson of level.aulas) {
        const progress = plan.progressoAula.find(item => item.aulaId === lesson.id);
        assert.ok(progress && progress.dataConclusao < attempt.iniciadoEm);
      }
    }
    for (let levelIndex = 1; levelIndex < catalog.levels.length; levelIndex++) {
      const level = catalog.levels[levelIndex];
      const progress = plan.progressoAula.filter(item => level.aulas.some(lesson => lesson.id === item.aulaId));
      if (!progress.length) continue;
      const previous = plan.tentativaProva.find(item => item.provaId === catalog.levels[levelIndex - 1].provaId);
      assert.ok(previous && previous.totalAcertos / previous.totalQuestoes >= 0.6);
      assert.ok(progress.every(item => item.dataConclusao > previous.concluidoEm));
    }
    for (const attempt of plan.tentativaQuiz) {
      const quiz = catalog.quizzes.find(item => item.id === attempt.quizId);
      const lesson = plan.progressoAula.find(item => item.aulaId === quiz.aulaId);
      assert.ok(lesson && lesson.dataConclusao < attempt.concluidoEm);
      const answers = plan.respostaQuiz.filter(answer => answer.tentativaId === attempt.id);
      assert.equal(answers.length, attempt.totalQuestoes);
      assert.equal(answers.filter(answer => answer.acertou).length, attempt.totalAcertos);
    }
  }
});

test('perfis incluem inativos, reprovação e conclusão de todos os níveis', () => {
  assert.equal(planUser(1, catalog, now).progressoAula.length, 0);
  const failed = planUser(45, catalog, now);
  assert.equal(failed.tentativaProva.length, 1);
  assert.ok(failed.tentativaProva[0].nota < 6);
  const complete = planUser(99, catalog, now);
  assert.equal(complete.tentativaProva.length, 3);
  assert.ok(complete.tentativaProva.every(attempt => attempt.nota >= 6));
  assert.deepEqual(planUser(99, catalog, now), complete);
});

test('entrada de produção recusa ambiente local, previews e outro banco', async () => {
  for (const env of [
    {},
    { RENDER: 'true', DATABASE_URL: 'postgresql://user:password@localhost:5433/cybereduca' },
    { RENDER: 'true', DATABASE_URL: 'postgresql://user:password@outro.neon.tech/neondb' },
    { RENDER: 'true', IS_PULL_REQUEST: 'true', DATABASE_URL: 'postgresql://user:password@ep-misty-mud-ac7fmdhq.sa-east-1.aws.neon.tech/neondb' },
  ]) assert.equal(await production({ apply: true, env }), undefined);
});
