import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const USUARIO_DEMO_ID = '11111111-1111-1111-1111-111111111111';

const TRILHA_ID = 'cd24b773-00b6-4750-9e38-c1a332554275';

const AULAS = [
  {
    id: '78cb06b5-859a-4bb3-a7c7-810d313c0cc3',
    titulo: 'O que é phishing?',
    conteudo: `Phishing é uma tentativa de enganar pessoas para roubar dados.

## Como se proteger

- Desconfie de mensagens urgentes.
- Confira o endereço dos sites.
- Não compartilhe senhas.`,
    ordem: 1,
  },
  {
    id: 'a7f6e51b-12f2-4c21-8119-38921db26a96',
    titulo: 'Senhas fortes e seguras',
    conteudo: `Uma senha forte ajuda a proteger suas contas.

## Boas práticas

- Use senhas longas.
- Misture letras, números e símbolos.
- Não reutilize a mesma senha.`,
    ordem: 2,
  },
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
    titulo: 'Segurança Digital Básica',
    descricao: 'Aprenda práticas essenciais para proteger seus dados.',
    ordem: 1,
  },
  create: {
    id: TRILHA_ID,
    titulo: 'Segurança Digital Básica',
    descricao: 'Aprenda práticas essenciais para proteger seus dados.',
    ordem: 1,
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
;

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
