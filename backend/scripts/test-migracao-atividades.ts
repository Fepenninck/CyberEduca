import 'dotenv/config';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { buildCatalog, contentId } from '../prisma/content/catalog';
import { libraryCourses } from '../prisma/content/course-library';
import { SIMULATION_SEEDS } from '../prisma/content/simulations';

const simId = (key: string) => {
  const hash = createHash('sha256').update(`cybereduca-simulation:${key}`).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
};

async function main() {
  const original = new URL(process.env.DATABASE_URL!);
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(original.hostname));
  const name = `cybereduca_test_${randomUUID().replaceAll('-', '')}`;
  assert.match(name, /^cybereduca_test_[a-f0-9]{32}$/);
  const url = new URL(original); url.pathname = `/${name}`;
  const admin = new PrismaClient();
  const prisma = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  let created = false;
  try {
    await admin.$executeRawUnsafe(`CREATE DATABASE "${name}"`); created = true;
    const migration = spawnSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'], {
      cwd: resolve(__dirname, '..'), env: { ...process.env, DATABASE_URL: url.toString() }, encoding: 'utf8', shell: false,
    });
    assert.equal(migration.status, 0, 'O histórico completo deve funcionar em um banco vazio.');
    assert.equal(await prisma.simulacao.count(), 12);
    // Somente o banco temporário é limpo para reproduzir um catálogo antigo.
    await prisma.simulacao.deleteMany();
    await prisma.categoriaSimulacao.deleteMany();
    const catalog = buildCatalog();
    const aulas = catalog.courses.flatMap(course => course.aulas);
    const track = await prisma.trilha.create({ data: { titulo: 'Fixture', descricao: 'Fixture', ordem: 1 } });
    await prisma.aula.createMany({ data: aulas.map((aula, index) => ({ id: aula.id, titulo: aula.titulo,
      conteudo: aula.conteudo, trilhaId: track.id, ordem: index + 1 })) });
    const user = await prisma.usuario.create({ data: { nome: 'Aluno preservado', email: 'atividades@exemplo.invalid' } });
    const progress = await prisma.progressoAula.create({ data: { usuarioId: user.id, aulaId: aulas[0].id } });
    const first = aulas[0];
    const legacyId = contentId(`quiz/${libraryCourses[0].id}/${libraryCourses[0].lessons[0].id}`);
    const legacy = await prisma.quiz.create({ data: { id: legacyId, titulo: 'Versão antiga', descricao: 'Histórico', aulaId: first.id, status: 'PUBLICADO',
      questoes: { create: { ...first.quiz.questao, alternativas: { create: first.quiz.questao.alternativas } } } },
    include: { questoes: { include: { alternativas: true } } } });
    const oldQuestion = legacy.questoes[0];
    const oldAnswer = oldQuestion.alternativas[0];
    const attempt = await prisma.tentativaQuiz.create({ data: { usuarioId: user.id, quizId: legacy.id, totalQuestoes: 1, totalAcertos: Number(oldAnswer.correta),
      respostas: { create: { questaoId: oldQuestion.id, alternativaId: oldAnswer.id, acertou: oldAnswer.correta } } }, include: { respostas: true } });
    const current = await prisma.quiz.create({ data: { id: first.quiz.id, titulo: 'Título editado pelo administrador', descricao: 'Edição preservada', aulaId: first.id, status: 'PUBLICADO' } });
    const originalQuestion = await prisma.questaoQuiz.create({ data: { quizId: current.id, enunciado: 'Primeira questão já respondida', explicacao: 'Original', ordem: 1,
      alternativas: { create: [{ texto: 'Sim', correta: true, ordem: 1 }, { texto: 'Não', correta: false, ordem: 2 }] } }, include: { alternativas: true } });
    const customizedQuestion = await prisma.questaoQuiz.create({ data: { id: first.quiz.revisoes[0].id, quizId: current.id, enunciado: 'Questão editada', explicacao: 'Não sobrescrever', ordem: 2,
      alternativas: { create: [{ texto: 'Escolha própria', correta: true, ordem: 1 }, { texto: 'Outra escolha', correta: false, ordem: 2 }] } }, include: { alternativas: true } });
    const archived = await prisma.quiz.create({ data: { id: aulas[1].quiz.id, aulaId: aulas[1].id, titulo: 'Arquivado pelo administrador', descricao: 'Preservar status', status: 'ARQUIVADO' } });
    const customQuiz = await prisma.quiz.create({ data: { aulaId: first.id, titulo: 'Quiz adicional do administrador', descricao: 'Preservado', status: 'PUBLICADO' } });
    const seed = SIMULATION_SEEDS[0];
    const category = await prisma.categoriaSimulacao.create({ data: { nome: seed.categoria, descricao: 'Categoria já existente' } });
    const simulation = await prisma.simulacao.create({ data: { id: simId(seed.key), titulo: 'Simulação editada', descricao: 'Mídia e edição preservadas', categoriaId: category.id,
      questoes: { create: { id: simId(`${seed.key}:q:0`), ordem: 0, enunciado: 'Decisão existente', contexto: '{"midia":"preservada"}', explicacao: 'Explicação existente',
        alternativas: { create: [{ id: simId(`${seed.key}:q:0:a:0`), texto: 'Ação própria', isCorreta: true, ordem: 0 }, { id: simId(`${seed.key}:q:0:a:1`), texto: 'Outra ação', isCorreta: false, ordem: 1 }] } } } },
    include: { questoes: { include: { alternativas: true } } } });
    const result = await prisma.resultadoSimulacao.create({ data: { usuarioId: user.id, simulacaoId: simulation.id, acertos: 1, totalQuestoes: 1, respostas: [{ questaoId: simulation.questoes[0].id }] } });
    const { id: scenarioId, ...scenarioData } = catalog.cenarios[0];
    const scenario = await prisma.cenarioPhishing.create({ data: { ...scenarioData, id: scenarioId, conteudoMensagem: 'Mensagem editada', status: 'RASCUNHO' } });
    const sql = readFileSync(resolve(__dirname, '../prisma/migrations/20261115230000_catalogo_quizzes_simulacoes/migration.sql'), 'utf8');
    await prisma.$executeRawUnsafe(sql);
    const synced = await prisma.quiz.findMany({ where: { id: { in: aulas.map(aula => aula.quiz.id) } }, include: { questoes: { include: { alternativas: true } } } });
    assert.equal(synced.length, 91);
    for (const quiz of synced) {
      assert.equal(quiz.questoes.length, 10);
      for (const question of quiz.questoes) assert.equal(question.alternativas.filter(item => item.correta).length, 1);
    }
    assert.deepEqual(await prisma.questaoQuiz.findUniqueOrThrow({ where: { id: originalQuestion.id }, include: { alternativas: true } }), originalQuestion);
    assert.deepEqual(await prisma.questaoQuiz.findUniqueOrThrow({ where: { id: customizedQuestion.id }, include: { alternativas: true } }), customizedQuestion);
    assert.deepEqual(await prisma.quiz.findUniqueOrThrow({ where: { id: current.id } }), current);
    assert.deepEqual(await prisma.quiz.findUniqueOrThrow({ where: { id: archived.id } }), archived);
    assert.deepEqual(await prisma.quiz.findUniqueOrThrow({ where: { id: customQuiz.id } }), customQuiz);
    assert.equal((await prisma.quiz.findUniqueOrThrow({ where: { id: legacy.id } })).status, 'ARQUIVADO');
    assert.deepEqual(await prisma.tentativaQuiz.findUniqueOrThrow({ where: { id: attempt.id }, include: { respostas: true } }), attempt);
    const simulations = await prisma.simulacao.findMany({ include: { questoes: { include: { alternativas: true } } } });
    assert.equal(simulations.length, 12);
    for (const item of simulations) {
      assert.equal(item.questoes.length, 3);
      for (const question of item.questoes) assert.equal(question.alternativas.filter(option => option.isCorreta).length, 1);
    }
    const savedQuestion = await prisma.questaoSimulacao.findUniqueOrThrow({ where: { id: simulation.questoes[0].id }, include: { alternativas: true } });
    assert.deepEqual(savedQuestion, simulation.questoes[0]);
    assert.equal((await prisma.simulacao.findUniqueOrThrow({ where: { id: simulation.id } })).titulo, simulation.titulo);
    assert.deepEqual(await prisma.resultadoSimulacao.findUniqueOrThrow({ where: { id: result.id } }), result);
    assert.deepEqual(await prisma.cenarioPhishing.findUniqueOrThrow({ where: { id: scenario.id } }), scenario);
    assert.equal(await prisma.cenarioPhishing.count(), 12);
    assert.deepEqual(await prisma.progressoAula.findUniqueOrThrow({ where: { id: progress.id } }), progress);
    assert.deepEqual(await prisma.usuario.findUniqueOrThrow({ where: { id: user.id } }), user);
    const counts = await Promise.all([prisma.questaoQuiz.count(), prisma.alternativaQuiz.count(), prisma.questaoSimulacao.count(), prisma.alternativaSimulacao.count()]);
    await prisma.$executeRawUnsafe(sql);
    assert.deepEqual(await Promise.all([prisma.questaoQuiz.count(), prisma.alternativaQuiz.count(), prisma.questaoSimulacao.count(), prisma.alternativaSimulacao.count()]), counts);
    console.log('Atividades validadas: 91 quizzes com 10 questões, 12 simulações com 3 decisões e 12 cenários; edições, mídias, arquivamentos, tentativas e resultados preservados; sem duplicação.');
  } finally {
    await prisma.$disconnect();
    if (created) await admin.$executeRawUnsafe(`DROP DATABASE "${name}" WITH (FORCE)`);
    await admin.$disconnect();
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
