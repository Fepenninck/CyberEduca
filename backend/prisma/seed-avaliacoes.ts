import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { avaliacoes } from './avaliacoes-niveis';

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (tx) => {
    // Retira somente as práticas genéricas criadas pelo seed anterior.
    // Questões, respostas e histórico dessas provas permanecem intactos.
    await tx.prova.updateMany({
      where: { id: { in: [1, 2, 3].map(i => `ce000000-0000-4000-8001-${String(i).padStart(12, '0')}`) } },
      data: { status: 'ARQUIVADO' },
    });
    for (const [indice, avaliacao] of avaliacoes.entries()) {
      const trilha = await tx.trilha.findUnique({ where: { id: avaliacao.trilhaId } });
      if (!trilha || trilha.nivel !== avaliacao.nivel) throw new Error('Trilha do nível não encontrada.');
      for (const questao of avaliacao.questoes) {
        const aula = await tx.aula.findFirst({
          where: { titulo: questao.aula, trilha: { nivel: avaliacao.nivel }, NOT: { conteudo: '' } },
        });
        if (!aula) throw new Error(`Aula de referência não encontrada: ${questao.aula}`);
        if (questao.opcoes.length !== 4 || !questao.opcoes[questao.correta]) throw new Error('Gabarito inválido.');
      }
      // IDs diferentes preservam as provas e tentativas anteriores.
      await tx.prova.upsert({
        where: { id: `ce000000-0000-4000-${indice === 0 ? '8003' : '8002'}-${String(indice + 1).padStart(12, '0')}` },
        update: {},
        create: {
          id: `ce000000-0000-4000-${indice === 0 ? '8003' : '8002'}-${String(indice + 1).padStart(12, '0')}`,
          titulo: avaliacao.titulo,
          descricao: avaliacao.descricao,
          trilhaId: trilha.id,
          status: 'PUBLICADO',
          questoes: { create: avaliacao.questoes.map((questao, ordem) => ({
            enunciado: questao.pergunta,
            explicacao: `${questao.explicacao}\nAula de referência: ${questao.aula}.`,
            ordem,
            alternativas: { create: questao.opcoes.map((texto, alternativa) => ({
              texto, ordem: alternativa, isCorreta: alternativa === questao.correta,
            })) },
          })) },
        },
      });
    }
  });
  console.log('Avaliações finais básica, intermediária e avançada publicadas: 30 questões vinculadas ao conteúdo das aulas.');
}

main().catch((erro: unknown) => {
  console.error('Não foi possível cadastrar as avaliações. Verifique a conexão e as migrações do banco.');
  if (erro instanceof Error && /Aula de referência|Trilha do nível|Gabarito inválido/.test(erro.message)) console.error(erro.message);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
