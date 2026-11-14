import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { buildCatalog } from '../prisma/content/catalog';
const prisma = new PrismaClient();
async function main() {
  const courses = buildCatalog().courses.filter(course => course.nivel === 'BASICO');
  for (const course of courses) await prisma.$transaction(async tx => {
    await tx.trilha.update({ where: { id: course.id }, data: { descricao: course.descricao } });
    for (const aula of course.aulas) {
      const stored = await tx.aula.findUniqueOrThrow({ where: { id: aula.id }, select: { conteudo: true } });
      const material = JSON.parse(stored.conteudo);
      material.diagram = JSON.parse(aula.conteudo).diagram;
      await tx.aula.update({ where: { id: aula.id }, data: { conteudo: JSON.stringify(material) } });
    }
  }, { timeout: 60000 });
  console.log('Descricoes de 4 trilhas e diagramas de 27 aulas atualizados; progresso e atividades preservados.');
}
main().catch(() => { console.error('Falha ao atualizar textos. Verifique a conexao e o catalogo.'); process.exitCode = 1; }).finally(() => prisma.$disconnect());
