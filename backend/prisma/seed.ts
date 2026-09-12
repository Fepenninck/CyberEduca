import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const USUARIO_DEMO_ID = '11111111-1111-1111-1111-111111111111';

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

  // ATENÇÃO: o seed é somente para desenvolvimento e recria as trilhas.
  // Não o execute em produção, pois ele apaga as aulas cadastradas.
  await prisma.aula.deleteMany();
  await prisma.trilha.deleteMany();

  const trilhas = [
    {
      id: 'nova-trilha',
      titulo: 'Nova trilha',
      descricao: 'Escreva aqui a descrição da sua trilha.',
      ordem: 1,
      aulas: [
        {
          id: 'nova-aula',
          titulo: 'Nova aula',
          conteudo: '',
          ordem: 1,
        },
      ],
    },
  ];

  for (const t of trilhas) {
    const { aulas, ...dados } = t;
    const trilha = await prisma.trilha.create({ data: dados });
    for (const a of aulas) {
      await prisma.aula.create({ data: { ...a, trilhaId: trilha.id } });
    }
  }

  console.log('Seed concluído: 1 trilha em branco, 1 aula em branco e 1 usuário demo.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
