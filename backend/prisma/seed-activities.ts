import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { buildCatalog } from './content/catalog';

const prisma = new PrismaClient();

async function main() {
  const { courses, cenarios } = buildCatalog();
  if (process.argv.includes('--dry-run')) {
    console.log(JSON.stringify({ trilhas: courses.length,
      aulas: courses.reduce((n, course) => n + course.aulas.length, 0),
      quizzes: courses.reduce((n, course) => n + course.aulas.length, 0),
      cenarios: cenarios.length }));
    return;
  }

  // Only insert missing content. Preserve administrative edits, statuses and progress.
  const last = await prisma.trilha.aggregate({ _max: { ordem: true } });
  const baseOrder = last._max.ordem ?? 0;
  for (const [index, course] of courses.entries()) {
    await prisma.$transaction(async tx => {
      await tx.trilha.upsert({ where: { id: course.id }, update: {},
        create: { id: course.id, titulo: course.titulo, descricao: course.descricao,
          nivel: course.nivel, ordem: baseOrder + index + 1, bloqueada: true } });
      for (const aula of course.aulas) {
        await tx.aula.upsert({ where: { id: aula.id }, update: {},
          create: { id: aula.id, titulo: aula.titulo, conteudo: aula.conteudo,
            ordem: aula.ordem, trilhaId: course.id } });
        const { questao, ...quiz } = aula.quiz;
        const { alternativas, ...question } = questao;
        await tx.quiz.upsert({ where: { id: quiz.id }, update: {},
          create: { ...quiz, aulaId: aula.id, status: 'PUBLICADO',
            questoes: { create: { ...question, alternativas: { create: alternativas } } } } });
      }
    }, { timeout: 60000 });
  }
  for (const cenario of cenarios) {
    await prisma.cenarioPhishing.upsert({ where: { id: cenario.id }, update: {},
      create: { ...cenario, status: 'PUBLICADO' } });
  }
  console.log('Importação concluída. Conteúdos existentes, tentativas e progressos preservados.');
}

main().catch(() => {
  // Connection errors can contain credentials; do not print the raw error.
  console.error('Falha ao importar. Verifique a conexão, as migrations e os conflitos de ordem das aulas.');
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
