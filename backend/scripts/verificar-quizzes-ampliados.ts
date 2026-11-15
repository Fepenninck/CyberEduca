import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { QuizzesService } from '../src/quizzes/quizzes.service';
import type { PrismaService } from '../src/prisma.service';

const prisma = new PrismaClient();
const rollback = new Error('VERIFICACAO_SEM_PERSISTENCIA');
const marker = `verificar-quizzes-${randomUUID()}`;

async function main() {
  const countsBefore = { tentativas: await prisma.tentativaQuiz.count(), respostas: await prisma.respostaQuiz.count() };
  try {
    await prisma.$transaction(async tx => {
      const quizzes = await tx.quiz.findMany({ where: { status: 'PUBLICADO' },
        include: { questoes: { include: { alternativas: true } } } });
      assert.equal(quizzes.length, 91);
      for (const quiz of quizzes) {
        assert.equal(quiz.questoes.length, 10);
        assert.equal(new Set(quiz.questoes.map(q => q.enunciado)).size, 10);
        assert.ok(quiz.questoes.every(q => q.alternativas.length >= 2 && q.alternativas.filter(a => a.correta).length === 1));
      }
      const quiz = quizzes[0];
      const adapter = new Proxy(tx, { get(target, key) {
        return key === '$transaction' ? (operation: (client: typeof tx) => unknown) => operation(tx) : Reflect.get(target, key);
      } }) as unknown as PrismaService;
      const service = new QuizzesService(adapter);
      for (const targetScore of [10, 5, 0]) {
        const user = await tx.usuario.create({ data: { nome: marker, email: `${marker}-${targetScore}@example.invalid` } });
        const publicQuiz = await service.buscarQuiz(quiz.id, user.id);
        assert.equal(publicQuiz.questoes.length, 10);
        assert.ok(publicQuiz.questoes.every(q => !('explicacao' in q) && q.alternativas.every(a => !('correta' in a))));
        const respostas = quiz.questoes.map((q, index) => ({ questaoId: q.id,
          alternativaId: q.alternativas.find(a => a.correta === (index < targetScore))!.id }));
        const result = await service.responderQuiz(user.id, quiz.id, { respostas });
        assert.equal(result.totalQuestoes, 10);
        assert.equal(result.totalAcertos, targetScore);
        assert.equal(result.feedback.length, 10);
        const saved = await tx.tentativaQuiz.findUniqueOrThrow({ where: { id: result.tentativaId }, include: { respostas: true } });
        assert.equal(saved.usuarioId, user.id);
        assert.equal(saved.respostas.length, 10);
        const recovered = await service.resultadoDoAluno(quiz.id, user.id);
        assert.equal(recovered?.totalAcertos, targetScore);
        assert.equal(recovered?.feedback.length, 10);
      }
      const pending = await tx.usuario.create({ data: { nome: marker, email: `${marker}-incompleto@example.invalid` } });
      await assert.rejects(() => service.responderQuiz(pending.id, quiz.id, { respostas: quiz.questoes.slice(0, 9).map(q => ({ questaoId: q.id, alternativaId: q.alternativas[0].id })) }));
      assert.equal(await tx.tentativaQuiz.count({ where: { usuarioId: pending.id } }), 0);
      throw rollback;
    }, { timeout: 60000 });
  } catch (error) { if (error !== rollback) throw error; }
  assert.deepEqual({ tentativas: await prisma.tentativaQuiz.count(), respostas: await prisma.respostaQuiz.count() }, countsBefore);
  assert.equal(await prisma.usuario.count({ where: { nome: marker } }), 0);
  console.log('VERIFICADO: 91 quizzes com 10 questões; correções 10/10, 5/10 e 0/10; resultados e respostas salvos por usuário; envio incompleto rejeitado; nenhum dado de teste persistido.');
}

main().catch(error => {
  console.error(error instanceof assert.AssertionError ? error.message : 'Falha na verificação dos quizzes; dados de teste revertidos.');
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
