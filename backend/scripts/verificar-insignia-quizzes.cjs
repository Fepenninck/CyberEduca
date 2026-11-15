require('dotenv').config({ quiet: true });
require('ts-node').register({ transpileOnly: true, compilerOptions: { rootDir: '.' } });
require('reflect-metadata');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { PrismaService } = require('../src/prisma.service');
const { UsuariosService } = require('../src/usuarios/usuarios.service');
const { QuizzesService } = require('../src/quizzes/quizzes.service');
const prisma = new PrismaService();
const rollback = new Error('VERIFICACAO_REVERTIDA');
const usuarioId = randomUUID();
(async () => {
  try {
    try {
      await prisma.$transaction(async tx => {
        const catalogo = await tx.quiz.findMany({ where: { status: 'PUBLICADO' }, include: { questoes: { include: { alternativas: true } } }, orderBy: { id: 'asc' } });
        assert.ok(catalogo.length > 1 && catalogo.every(q => q.questoes.length > 1));
        await tx.usuario.create({ data: { id: usuarioId, nome: 'Verificação temporária da insígnia', email: `${usuarioId}@example.invalid` } });
        const adapter = new Proxy(tx, { get(target, key) { return key === '$transaction' ? operation => operation(tx) : Reflect.get(target, key); } });
        const usuarios = new UsuariosService(adapter), quizzes = new QuizzesService(adapter);
        assert.equal((await usuarios.conquistaQuizzes(usuarioId)).conquistada, false);
        const anterior = new Date(Date.now() - 60000);
        const tentativas = catalogo.slice(0, -1).map(quiz => ({ id: randomUUID(), quiz, concluidoEm: anterior }));
        await tx.tentativaQuiz.createMany({ data: tentativas.map(({ id, quiz, concluidoEm }) => ({ id, usuarioId, quizId: quiz.id, totalQuestoes: quiz.questoes.length, totalAcertos: 0, concluidoEm })) });
        await tx.respostaQuiz.createMany({ data: tentativas.flatMap(({ id, quiz }) => quiz.questoes.map(q => ({ id: randomUUID(), tentativaId: id, questaoId: q.id, alternativaId: q.alternativas.find(a => !a.correta).id, acertou: false }))) });
        const ultimo = catalogo.at(-1), primeira = ultimo.questoes[0];
        const antiga = await tx.tentativaQuiz.create({ data: { usuarioId, quizId: ultimo.id, totalQuestoes: 1, totalAcertos: 0, concluidoEm: anterior, respostas: { create: { questaoId: primeira.id, alternativaId: primeira.alternativas.find(a => !a.correta).id, acertou: false } } } });
        const pendente = await usuarios.conquistaQuizzes(usuarioId);
        assert.equal(pendente.quizzesConcluidos, catalogo.length - 1);
        assert.equal(pendente.conquistada, false);
        const envio = await quizzes.responderQuiz(usuarioId, ultimo.id, { respostas: ultimo.questoes.map(q => ({ questaoId: q.id, alternativaId: q.alternativas.find(a => !a.correta).id })) });
        assert.equal(envio.totalAcertos, 0);
        const conquista = await usuarios.conquistaQuizzes(usuarioId);
        assert.equal(conquista.conquistada, true);
        assert.equal(conquista.quizzesConcluidos, catalogo.length);
        assert.ok(conquista.conquistadaEm);
        assert.ok(await tx.tentativaQuiz.findUnique({ where: { id: antiga.id } }));
        console.log(JSON.stringify({ quizzes: catalogo.length, antesDoUltimo: pendente.quizzesConcluidos, aposUltimo: conquista.quizzesConcluidos, liberadaSemNotaMinima: true, tentativaAntigaPreservada: true }));
        throw rollback;
      }, { timeout: 120000 });
    } catch (error) { if (error !== rollback) throw error; }
    assert.equal(await prisma.usuario.count({ where: { id: usuarioId } }), 0);
    assert.equal(await prisma.tentativaQuiz.count({ where: { usuarioId } }), 0);
    console.log('Insígnia verificada com o catálogo real. Todos os dados de teste foram revertidos.');
  } finally { await prisma.$disconnect(); }
})().catch(error => { console.error(error instanceof assert.AssertionError ? error.message : 'Falha na verificação da insígnia. A transação de teste foi revertida.'); process.exitCode = 1; });
