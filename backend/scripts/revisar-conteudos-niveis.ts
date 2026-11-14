import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { buildCatalog, contentId } from '../prisma/content/catalog';
import { aulasBasicas, moduloBasico } from '../prisma/content/modulo-basico';
import { avaliacoes } from '../prisma/avaliacoes-niveis';

const prisma = new PrismaClient();
async function main() {
  const { courses } = buildCatalog();
  const allIds = [...courses.flatMap(course => course.aulas.map(aula => aula.id)), ...aulasBasicas.map(aula => aula.id)];
  const count = await prisma.aula.count({ where: { id: { in: allIds } } });
  if (count !== allIds.length) throw new Error('Catálogo incompleto; nenhuma revisão iniciada.');
  if (process.argv.includes('--verify')) {
    const ids = courses.flatMap(course => course.aulas.map(aula => aula.id));
    const aulas = await prisma.aula.findMany({ where: { id: { in: ids } }, select: { conteudo: true } });
    const quizzes = await prisma.quiz.count({ where: { aulaId: { in: ids }, status: 'PUBLICADO' } });
    if (aulas.some(aula => !JSON.parse(aula.conteudo).level) || quizzes !== ids.length) throw new Error('Revisão incompleta.');
    console.log(`Verificado: ${aulas.length} aulas com nível e ${quizzes} atividades publicadas.`);
    return;
  }
  if (process.argv.includes('--dry-run')) {
    console.log(`Revisão pronta: ${count} aulas, sem exclusão de progresso ou tentativas.`);
    return;
  }
  for (const course of courses) {
    await prisma.$transaction(async tx => {
      await tx.trilha.update({ where: { id: course.id }, data: { titulo: course.titulo, descricao: course.descricao } });
      for (const aula of course.aulas) {
        await tx.aula.update({ where: { id: aula.id }, data: { titulo: aula.titulo, conteudo: aula.conteudo } });
        // Nova atividade preserva questões e respostas das tentativas antigas.
        const quizId = contentId(`pedagogia-v2/${aula.id}`);
        await tx.quiz.updateMany({ where: { aulaId: aula.id, status: 'PUBLICADO', id: { not: quizId } }, data: { status: 'ARQUIVADO' } });
        const question = aula.quiz.questao;
        await tx.quiz.upsert({ where: { id: quizId }, update: {}, create: {
          id: quizId, aulaId: aula.id, titulo: aula.quiz.titulo, descricao: aula.quiz.descricao, status: 'PUBLICADO',
          questoes: { create: { enunciado: question.enunciado, explicacao: question.explicacao, ordem: 1,
            alternativas: { create: question.alternativas.map(({ texto, correta, ordem }) => ({ texto, correta, ordem })) },
          } },
        } });
      }
    }, { timeout: 60000 });
    console.log(`Revisado: ${course.nivel} — ${course.aulas.length} aulas.`);
  }
  await prisma.$transaction([
    prisma.trilha.update({ where: { id: 'cd24b773-00b6-4750-9e38-c1a332554275' }, data: moduloBasico }),
    ...aulasBasicas.map(({ id, titulo, conteudo }) => prisma.aula.update({ where: { id }, data: { titulo, conteudo } })),
  ]);
  const basic = avaliacoes[0];
  const provaId = 'ce000000-0000-4000-8003-000000000001';
  await prisma.$transaction(async tx => {
    await tx.prova.updateMany({ where: { trilhaId: basic.trilhaId, status: 'PUBLICADO', id: { not: provaId } }, data: { status: 'ARQUIVADO' } });
    await tx.prova.upsert({ where: { id: provaId }, update: {}, create: {
      id: provaId, trilhaId: basic.trilhaId, titulo: basic.titulo, descricao: basic.descricao, status: 'PUBLICADO',
      questoes: { create: basic.questoes.map((question, ordem) => ({ enunciado: question.pergunta,
        explicacao: `${question.explicacao}\nAula de referência: ${question.aula}.`, ordem,
        alternativas: { create: question.opcoes.map((texto, index) => ({ texto, ordem: index, isCorreta: index === question.correta })) },
      })) },
    } });
  }, { timeout: 60000 });
  console.log('Revisão concluída. Aula de boas-vindas, IDs das aulas e históricos preservados.');
}
main().catch(() => {
  console.error('Falha na revisão. Verifique conexão e catálogo; cursos já concluídos podem ser reprocessados com segurança.');
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
