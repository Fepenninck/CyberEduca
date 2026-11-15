const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { PrismaClient } = require('@prisma/client');
const snapshot = require('../prisma/content/catalogo-local-20261115.json');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });

async function main() {
  const source = new URL(process.env.DATABASE_URL);
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(source.hostname));
  const name = `cybereduca_test_${randomUUID().replaceAll('-', '')}`;
  assert.match(name, /^cybereduca_test_[a-f0-9]{32}$/);
  const url = new URL(source); url.pathname = `/${name}`;
  const env = { ...process.env, DATABASE_URL: url.toString(), DIRECT_URL: url.toString(), DATABASE_URL_UNPOOLED: '' };
  const admin = new PrismaClient();
  const prisma = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  let created = false;
  try {
    await admin.$executeRawUnsafe(`CREATE DATABASE "${name}"`); created = true;
    const migrated = spawnSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'],
      { cwd: path.resolve(__dirname, '..'), env, encoding: 'utf8', shell: false });
    assert.equal(migrated.status, 0, (migrated.stdout || '') + (migrated.stderr || ''));
    for (const spec of snapshot.tables) {
      const count = await prisma.$queryRawUnsafe(`SELECT count(*)::integer AS quantidade FROM "${spec.table}"`);
      assert.equal(count[0].quantidade, spec.rows.length, spec.table);
    }
    assert.equal(await prisma.usuario.count(), 0);
    assert.equal(await prisma.progressoAula.count(), 0);
    assert.equal(await prisma.tentativaQuiz.count(), 0);
    assert.equal(await prisma.tentativaProva.count(), 0);
    for (const lesson of snapshot.tables.find(table => table.table === 'Aula').rows) {
      assert.equal((await prisma.aula.findUniqueOrThrow({ where: { id: lesson.id } })).conteudo, lesson.conteudo);
    }
    const examQuestions = snapshot.tables.find(table => table.table === 'QuestaoProva').rows;
    const quiz = snapshot.tables.find(table => table.table === 'Quiz').rows.find(row => row.status === 'PUBLICADO' && examQuestions.some(question => question.explicacao.includes(`[aula:${row.aulaId}]`)));
    const localLesson = await prisma.aula.findUniqueOrThrow({ where: { id: quiz.aulaId } });
    const remoteLessonId = randomUUID();
    await prisma.aula.update({ where: { id: localLesson.id }, data: { ordem: 9998 } });
    await prisma.aula.create({ data: { ...localLesson, id: remoteLessonId } });
    await prisma.quiz.updateMany({ where: { aulaId: localLesson.id }, data: { aulaId: remoteLessonId } });
    await prisma.cenarioPhishing.updateMany({ where: { aulaId: localLesson.id }, data: { aulaId: remoteLessonId } });
    await prisma.aula.delete({ where: { id: localLesson.id } });
    const question = await prisma.questaoQuiz.findFirstOrThrow({ where: { quizId: quiz.id, ordem: 1 }, include: { alternativas: { orderBy: { ordem: 'asc' } } } });
    const remoteQuestionId = randomUUID();
    // Reproduz IDs gerados em produção diferentes dos IDs gerados no banco local.
    // Não existem respostas neste ponto do banco de teste.
    await prisma.questaoQuiz.update({ where: { id: question.id }, data: { ordem: 9999 } });
    const remote = await prisma.questaoQuiz.create({ data: { id: remoteQuestionId, quizId: question.quizId,
      enunciado: 'Versão antiga da questão', explicacao: 'Antiga', ordem: 1,
      alternativas: { create: question.alternativas.map(option => ({ texto: option.texto, correta: option.correta, ordem: option.ordem })) } },
    include: { alternativas: { orderBy: { ordem: 'asc' } } } });
    await prisma.alternativaQuiz.deleteMany({ where: { questaoId: question.id } });
    await prisma.questaoQuiz.delete({ where: { id: question.id } });
    const lesson = await prisma.aula.findUniqueOrThrow({ where: { id: remoteLessonId } });
    const custom = await prisma.aula.create({ data: { titulo: 'Aula exclusiva da produção', conteudo: 'Preservar também.', trilhaId: lesson.trilhaId, ordem: 999 } });
    await prisma.aula.update({ where: { id: lesson.id }, data: { conteudo: 'Versão antiga da aula.' } });
    const user = await prisma.usuario.create({ data: { nome: 'Aluno real preservado', email: 'producao@exemplo.invalid' } });
    const progress = await prisma.progressoAula.create({ data: { usuarioId: user.id, aulaId: lesson.id } });
    const answer = remote.alternativas[0];
    const attempt = await prisma.tentativaQuiz.create({ data: { usuarioId: user.id, quizId: quiz.id, totalQuestoes: 1, totalAcertos: Number(answer.correta),
      respostas: { create: { questaoId: remote.id, alternativaId: answer.id, acertou: answer.correta } } }, include: { respostas: true } });
    const exam = await prisma.prova.findFirstOrThrow({ where: { status: 'PUBLICADO' } });
    const examAttempt = await prisma.tentativaProva.create({ data: { usuarioId: user.id, provaId: exam.id, totalQuestoes: 10, totalAcertos: 6, nota: 6, concluidoEm: new Date() } });
    const sql = fs.readFileSync(path.resolve(__dirname, '../prisma/migrations/20261115235000_sincronizar_catalogo_local/migration.sql'), 'utf8');
    await prisma.$executeRawUnsafe(sql);
    assert.equal((await prisma.aula.findUniqueOrThrow({ where: { id: lesson.id } })).conteudo, lesson.conteudo);
    assert.equal(await prisma.aula.findUnique({ where: { id: localLesson.id } }), null);
    assert.equal((await prisma.quiz.findUniqueOrThrow({ where: { id: quiz.id } })).aulaId, remoteLessonId);
    const reference = examQuestions.find(question => question.explicacao.includes(`[aula:${localLesson.id}]`));
    assert.ok((await prisma.questaoProva.findUniqueOrThrow({ where: { id: reference.id } })).explicacao.includes(`[aula:${remoteLessonId}]`));
    assert.deepEqual(await prisma.aula.findUniqueOrThrow({ where: { id: custom.id } }), custom);
    assert.equal(await prisma.questaoQuiz.findUnique({ where: { id: question.id } }), null);
    const restored = await prisma.questaoQuiz.findUniqueOrThrow({ where: { id: remote.id }, include: { alternativas: { orderBy: { ordem: 'asc' } } } });
    assert.equal(restored.enunciado, question.enunciado);
    assert.deepEqual(restored.alternativas.map(item => item.id), remote.alternativas.map(item => item.id));
    assert.deepEqual(restored.alternativas.map(({ id: _id, questaoId: _question, ...rest }) => rest),
      question.alternativas.map(({ id: _id, questaoId: _question, ...rest }) => rest));
    assert.deepEqual(await prisma.tentativaQuiz.findUniqueOrThrow({ where: { id: attempt.id }, include: { respostas: true } }), attempt);
    assert.deepEqual(await prisma.tentativaProva.findUniqueOrThrow({ where: { id: examAttempt.id } }), examAttempt);
    assert.deepEqual(await prisma.progressoAula.findUniqueOrThrow({ where: { id: progress.id } }), progress);
    assert.deepEqual(await prisma.usuario.findUniqueOrThrow({ where: { id: user.id } }), user);
    assert.equal(await prisma.aula.count(), 98);
    assert.equal(await prisma.questaoQuiz.count(), 1001);
    assert.equal(await prisma.alternativaQuiz.count(), 2306);
    // O Prisma registra a sincronização como aplicada, preservando edições posteriores.
    await prisma.aula.update({ where: { id: lesson.id }, data: { conteudo: 'Edição posterior válida.' } });
    const repeated = spawnSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'],
      { cwd: path.resolve(__dirname, '..'), env, encoding: 'utf8', shell: false });
    assert.equal(repeated.status, 0);
    assert.equal((await prisma.aula.findUniqueOrThrow({ where: { id: lesson.id } })).conteudo, 'Edição posterior válida.');
    console.log('Snapshot validado em PostgreSQL: catálogo completo importado, textos locais reproduzidos, IDs divergentes conciliados, usuários/progresso/respostas preservados e nenhuma exclusão de conteúdo exclusivo de produção.');
  } finally {
    await prisma.$disconnect();
    if (created) await admin.$executeRawUnsafe(`DROP DATABASE "${name}" WITH (FORCE)`);
    await admin.$disconnect();
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
