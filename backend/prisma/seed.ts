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

  // limpa conteudo anterior para o seed poder rodar mais de uma vez
  await prisma.aula.deleteMany();
  await prisma.trilha.deleteMany();

  const trilhas = [
    {
      titulo: 'Fundamentos de Seguranca Digital',
      descricao: 'Conceitos essenciais para se proteger no ambiente digital.',
      ordem: 1,
      aulas: [
        {
          titulo: 'O que e ciberseguranca',
          conteudo:
            'Ciberseguranca e o conjunto de praticas, tecnologias e processos que protegem sistemas, redes e dados contra acessos nao autorizados. Ela se apoia em tres pilares: confidencialidade, integridade e disponibilidade da informacao.',
          ordem: 1,
        },
        {
          titulo: 'Principais tipos de ataque',
          conteudo:
            'Phishing, forca bruta, engenharia social e malware sao os vetores mais comuns. O phishing explora a confianca do usuario, enquanto a forca bruta explora senhas fracas. Conhecer cada vetor e o primeiro passo para se defender.',
          ordem: 2,
        },
        {
          titulo: 'Senhas fortes e gerenciadores',
          conteudo:
            'Uma senha forte combina tamanho e imprevisibilidade. Reutilizar senhas e o erro mais comum: um vazamento em um servico compromete todos os outros. Gerenciadores de senha eliminam esse risco e permitem senhas unicas para cada conta.',
          ordem: 3,
        },
      ],
    },
    {
      titulo: 'Reconhecendo Golpes Online',
      descricao: 'Como identificar tentativas de fraude no dia a dia.',
      ordem: 2,
      aulas: [
        {
          titulo: 'Anatomia de um e-mail de phishing',
          conteudo:
            'Remetente com dominio suspeito, urgencia artificial, erros de escrita e links encurtados sao sinais classicos. Passe o mouse sobre o link antes de clicar e compare o endereco real com o texto exibido.',
          ordem: 1,
        },
        {
          titulo: 'Golpes em mensageiros',
          conteudo:
            'Clonagem de WhatsApp e perfis falsos exploram a confianca em contatos conhecidos. O pedido quase sempre envolve dinheiro e pressa. Ative a verificacao em duas etapas no aplicativo para reduzir o risco de clonagem.',
          ordem: 2,
        },
        {
          titulo: 'Boas praticas de verificacao',
          conteudo:
            'Confirme por um segundo canal antes de agir sobre qualquer pedido financeiro. Ligue para a pessoa, acesse o site oficial digitando o endereco manualmente e desconfie de qualquer contato que proiba voce de verificar.',
          ordem: 3,
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

  console.log('Seed concluido: 2 trilhas, 6 aulas, 1 usuario demo.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
