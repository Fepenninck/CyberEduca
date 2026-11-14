import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { aulasBasicas, moduloBasico } from '../prisma/content/modulo-basico';

const prisma = new PrismaClient();

async function main() {
  const trilhaId = 'cd24b773-00b6-4750-9e38-c1a332554275';
  const existentes = await prisma.aula.count({
    where: { trilhaId, id: { in: aulasBasicas.map(aula => aula.id) } },
  });
  if (existentes !== aulasBasicas.length) {
    throw new Error('As cinco aulas esperadas precisam existir antes da atualização.');
  }
  await prisma.$transaction([
    prisma.trilha.update({ where: { id: trilhaId }, data: moduloBasico }),
    ...aulasBasicas.map(({ id, titulo, conteudo }) =>
      prisma.aula.updateMany({ where: { id, trilhaId }, data: { titulo, conteudo } }),
    ),
  ]);
  console.log('Módulo 1 atualizado: aulas 2 a 6 simplificadas; boas-vindas, IDs e progresso preservados.');
}

main().catch(() => {
  console.error('Não foi possível atualizar o módulo básico. Verifique a conexão e a existência das aulas.');
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
