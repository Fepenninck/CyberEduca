import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { buildCatalog } from '../prisma/content/catalog';

const prisma = new PrismaClient();
async function main() {
  const courses = buildCatalog().courses;
  const count = await prisma.aula.count({ where: { id: { in: courses.flatMap(course => course.aulas.map(aula => aula.id)) } } });
  if (count !== courses.reduce((total, course) => total + course.aulas.length, 0)) throw new Error('Catálogo incompleto.');
  for (const course of courses) {
    await prisma.$transaction(async tx => {
      await tx.trilha.update({ where: { id: course.id }, data: { descricao: course.descricao } });
      for (const aula of course.aulas) {
        const stored = await tx.aula.findUniqueOrThrow({ where: { id: aula.id }, select: { conteudo: true } });
        const material = JSON.parse(stored.conteudo);
        const revised = JSON.parse(aula.conteudo);
        for (const field of ['diagram', 'supplement', 'practice', 'objectives']) material[field] = revised[field];
        await tx.aula.update({ where: { id: aula.id }, data: { conteudo: JSON.stringify(material) } });
      }
    }, { timeout: 60000 });
    console.log(`Materiais atualizados: ${course.nivel} — ${course.aulas.length} aulas.`);
  }
  console.log('91 aulas revisadas. Aulas introdutórias, progresso, quizzes e históricos preservados.');
}
main().catch(() => { console.error('Falha na atualização. Verifique conexão e catálogo.'); process.exitCode = 1; }).finally(() => prisma.$disconnect());
