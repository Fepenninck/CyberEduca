import { boasVindas } from './content/boas-vindas';
import { aulasBasicas, moduloBasico } from './content/modulo-basico';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

export const USUARIO_DEMO_ID = '11111111-1111-1111-1111-111111111111';

const TRILHA_ID = 'cd24b773-00b6-4750-9e38-c1a332554275';
const TRILHA_02_ID = '9b98b7a6-5c4d-4e3f-8a2b-1c0d9e8f7a61';
const TRILHA_03_ID = '6a7b8c9d-0e1f-4a2b-9c3d-5e6f70819203';

const AULAS = [
  {
    id: 'b1a2c3d4-1111-2222-3333-444444444441',
    titulo: '00. Boas-vindas e Introdução à Trilha',
    conteudo: boasVindas,
    ordem: 1,
  },
  ...aulasBasicas,
];

async function main() {
  await prisma.usuario.upsert({
    where: { id: USUARIO_DEMO_ID },
    update: {},
    create: {
      id: USUARIO_DEMO_ID,
      nome: 'Usuario Demo',
      email: 'demo@cybereduca.com',
      senhaHash: 'placeholder',
    },
  });

  await prisma.trilha.upsert({
    where: { id: TRILHA_ID },
    update: {
      titulo: moduloBasico.titulo,
      descricao: moduloBasico.descricao,
      nivel: 'BASICO',
      bloqueada: false,
      ordem: 1,
    },
    create: {
      id: TRILHA_ID,
      titulo: moduloBasico.titulo,
      descricao: moduloBasico.descricao,
      nivel: 'BASICO',
      bloqueada: false,
      ordem: 1,
    },
  });

  await prisma.trilha.upsert({
    where: { id: TRILHA_02_ID },
    update: {
      titulo: 'Segurança Digital Intermediária',
      descricao: 'Aprofunde seus conhecimentos com cenários e práticas de defesa.',
      nivel: 'INTERMEDIARIO',
      bloqueada: true,
      ordem: 2,
    },
    create: {
      id: TRILHA_02_ID,
      titulo: 'Segurança Digital Intermediária',
      descricao: 'Aprofunde seus conhecimentos com cenários e práticas de defesa.',
      nivel: 'INTERMEDIARIO',
      bloqueada: true,
      ordem: 2,
    },
  });

  await prisma.trilha.upsert({
    where: { id: TRILHA_03_ID },
    update: {
      titulo: 'Defesa Avançada e Resposta a Incidentes',
      descricao: 'Explore técnicas avançadas de monitoramento e resposta a incidentes.',
      nivel: 'AVANCADO',
      bloqueada: true,
      ordem: 3,
    },
    create: {
      id: TRILHA_03_ID,
      titulo: 'Defesa Avançada e Resposta a Incidentes',
      descricao: 'Explore técnicas avançadas de monitoramento e resposta a incidentes.',
      nivel: 'AVANCADO',
      bloqueada: true,
      ordem: 3,
    },
  });

  const idsAtuais = AULAS.map((a) => a.id);
  await prisma.aula.deleteMany({
    where: {
      trilhaId: TRILHA_ID,
      id: { notIn: idsAtuais },
    },
  });

  for (const aula of AULAS) {
    await prisma.aula.upsert({
      where: { id: aula.id },
      update: {
        titulo: aula.titulo,
        conteudo: aula.conteudo,
        ordem: aula.ordem,
        trilhaId: TRILHA_ID,
      },
      create: {
        ...aula,
        trilhaId: TRILHA_ID,
      },
    });
  }

  console.log('Seed concluído: 3 trilhas, 6 aulas e 1 usuário demo criados com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
