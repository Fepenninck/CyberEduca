import 'dotenv/config';
import assert from 'node:assert/strict';
import { Prisma, PrismaClient } from '@prisma/client';
import { buildCatalog } from '../prisma/content/catalog';

// Sem --apply a execução é somente leitura. A importação é aditiva, atômica e
// repetível: não modifica questões, alternativas, tentativas ou respostas antigas.
const prisma = new PrismaClient();
const expected = buildCatalog().courses.flatMap(course => course.aulas);

async function main() {
  const apply = process.argv.includes('--apply');
  const result = await prisma.$transaction(async tx => {
    const quizzes = await tx.quiz.findMany({ where: { status: 'PUBLICADO' },
      include: { questoes: { orderBy: { ordem: 'asc' }, include: { alternativas: { orderBy: { ordem: 'asc' } } } } },
      orderBy: { id: 'asc' } });
    const originalQuestions = await tx.questaoQuiz.findMany({ orderBy: { id: 'asc' } });
    const originalAlternatives = await tx.alternativaQuiz.findMany({ orderBy: { id: 'asc' } });
    const attempts = await tx.tentativaQuiz.findMany({ orderBy: { id: 'asc' } });
    const answers = await tx.respostaQuiz.findMany({ orderBy: { id: 'asc' } });
    const plan = quizzes.map(quiz => {
      const aula = expected.find(item => item.id === quiz.aulaId && item.quiz.id === quiz.id);
      assert.ok(aula, `Quiz fora do catálogo editorial: ${quiz.id}`);
      const first = quiz.questoes.find(q => q.ordem === 1);
      assert.ok(first && first.ordem === 1, `Questão original ausente: ${quiz.id}`);
      assert.equal(first.enunciado, aula.quiz.questao.enunciado, `Edição editorial detectada: ${quiz.id}`);
      const original = aula.quiz.questao;
      assert.deepEqual({ enunciado: first.enunciado, explicacao: first.explicacao,
        alternativas: first.alternativas.map(a => ({ texto: a.texto, correta: a.correta, ordem: a.ordem })) },
      { enunciado: original.enunciado, explicacao: original.explicacao,
        alternativas: original.alternativas.map(a => ({ texto: a.texto, correta: a.correta, ordem: a.ordem })) },
      `Conteúdo original editado: ${quiz.id}`);
      const desired = aula.quiz.revisoes;
      for (const saved of quiz.questoes.filter(q => q.id !== first.id)) {
        const source = desired.find(question => question.id === saved.id);
        assert.ok(source, `Questão fora do plano; nenhuma remoção será feita: ${saved.id}`);
        assert.deepEqual({ id: saved.id, enunciado: saved.enunciado, explicacao: saved.explicacao, ordem: saved.ordem,
          alternativas: saved.alternativas.map(({ questaoId: _ignored, ...alternative }) => alternative) }, source,
        `Questão editada; importação interrompida: ${saved.id}`);
      }
      assert.equal(desired.length + 1, 10);
      assert.equal(new Set([first.enunciado, ...desired.map(q => q.enunciado)]).size, 10);
      return { quiz, missing: desired.filter(q => !quiz.questoes.some(saved => saved.id === q.id)) };
    });
    const newQuestions = plan.reduce((sum, item) => sum + item.missing.length, 0);
    if (apply) {
      for (const item of plan) for (const question of item.missing) {
        const { alternativas, ...data } = question;
        await tx.questaoQuiz.create({ data: { ...data, quizId: item.quiz.id, alternativas: { create: alternativas } } });
      }
      const final = await tx.quiz.findMany({ where: { id: { in: quizzes.map(q => q.id) } }, select: { _count: { select: { questoes: true } } } });
      assert.ok(final.every(quiz => quiz._count.questoes === 10));
      assert.deepEqual(await tx.questaoQuiz.findMany({ where: { id: { in: originalQuestions.map(q => q.id) } }, orderBy: { id: 'asc' } }), originalQuestions);
      assert.deepEqual(await tx.alternativaQuiz.findMany({ where: { id: { in: originalAlternatives.map(a => a.id) } }, orderBy: { id: 'asc' } }), originalAlternatives);
      assert.deepEqual(await tx.tentativaQuiz.findMany({ orderBy: { id: 'asc' } }), attempts);
      assert.deepEqual(await tx.respostaQuiz.findMany({ orderBy: { id: 'asc' } }), answers);
    }
    return { modo: apply ? 'aplicado' : 'somente leitura', quizzes: quizzes.length, questoesPorQuiz: 10,
      questoesAdicionadas: apply ? newQuestions : 0, questoesPlanejadas: newQuestions,
      tentativasPreservadas: attempts.length, respostasPreservadas: answers.length };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 120000 });
  console.log(JSON.stringify(result, null, 2));
}

main().catch(error => {
  // Mensagens de conexão podem conter credenciais. Exibir só erros das validações.
  console.error(error instanceof assert.AssertionError ? error.message : 'Falha na importação. A transação foi revertida; confira a conexão e o catálogo.');
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
