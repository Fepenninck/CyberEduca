import 'dotenv/config';
import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { SIMULATION_SEEDS } from './content/simulations';

const id = (key: string) => {
  const hash = createHash('sha256').update(`cybereduca-simulation:${key}`).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
};
export async function seedSimulacoes(prisma: PrismaClient) {
  for (const [simulationIndex, item] of SIMULATION_SEEDS.entries()) {
    const categoria = await prisma.categoriaSimulacao.upsert({ where: { nome: item.categoria }, update: {}, create: {
      id: id(`categoria:${item.categoria}`), nome: item.categoria, descricao: `Situações fictícias para praticar decisões sobre ${item.categoria.toLowerCase()}.`,
    } });
    await prisma.simulacao.upsert({ where: { id: id(item.key) }, update: {}, create: {
      id: id(item.key), categoriaId: categoria.id, titulo: item.titulo, descricao: item.descricao,
      nivel: item.nivel, duracaoMinutos: item.duracaoMinutos,
      questoes: { create: item.decisoes.map((decision, index) => {
        const values = [decision.correta, ...decision.outras];
        const offset = (index + simulationIndex) % values.length;
        const options = [...values.slice(offset), ...values.slice(0, offset)];
        return { id: id(`${item.key}:q:${index}`), ordem: index, enunciado: decision.enunciado, contexto: decision.contexto, explicacao: decision.explicacao,
          alternativas: { create: options.map((texto, ordem) => ({ id: id(`${item.key}:q:${index}:a:${ordem}`), ordem, texto, isCorreta: texto === decision.correta })) } };
      }) },
    } });
  }
}
if (require.main === module) {
  const prisma = new PrismaClient();
  const run = process.argv.includes('--dry-run')
    ? Promise.resolve(console.log(`${SIMULATION_SEEDS.length} simulações, ${new Set(SIMULATION_SEEDS.map(item => item.categoria)).size} temas, ${SIMULATION_SEEDS.reduce((total, item) => total + item.decisoes.length, 0)} decisões.`))
    : seedSimulacoes(prisma).then(() => console.log('Simulações importadas. Conteúdos existentes e resultados dos alunos preservados.'));
  run.catch(() => { console.error('Não foi possível importar as simulações. Confira as migrations e a conexão.'); process.exitCode = 1; }).finally(() => prisma.$disconnect());
}