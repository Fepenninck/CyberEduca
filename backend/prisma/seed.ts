import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const USUARIO_DEMO_ID = '11111111-1111-1111-1111-111111111111';

const TRILHA_ID = 'cd24b773-00b6-4750-9e38-c1a332554275';
const TRILHA_02_ID = '9b98b7a6-5c4d-4e3f-8a2b-1c0d9e8f7a61';
const TRILHA_03_ID = '6a7b8c9d-0e1f-4a2b-9c3d-5e6f70819203';

const AULAS = [
  {
    id: 'b1a2c3d4-1111-2222-3333-444444444441',
    titulo: '00. Boas-vindas e Introdução à Trilha',
    conteudo: `<iframe width="100%" height="400" src="https://www.youtube.com/embed/doFxojMJwLc" title="Boas-vindas CyberEduca+" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## Seja muito bem-vindo!
Esta trilha foi desenhada para dar a você os fundamentos essenciais de Segurança da Informação no dia a dia pessoal e profissional.

## O que você vai aprender

- A importância de proteger dados e credenciais;
- Como identificar tentativas de phishing e engenharia social;
- Boas práticas com senhas, 2FA e redes Wi-Fi públicas.

## Como aproveitar o curso
Assista e leia os conteúdos na ordem sequencial. No final de cada etapa, clique em "Marcar como concluída" para acompanhar seu progresso.`,
    ordem: 1,
  },
  {
    id: 'a7f6e51b-12f2-4c21-8119-38921db26a96',
    titulo: '01. Senhas fortes e seguras',
    conteudo: `## Por que proteger sua senha?
A senha é a primeira linha de defesa da sua conta. Se ela vaza ou é descoberta, todo o sistema fica vulnerável a acessos não autorizados.

## O perigo da reutilização
Usar a mesma senha no e-mail, nas redes sociais e em sistemas da empresa faz com que um único vazamento comprometa todas as suas contas (ataque de credential stuffing).

## Regras de ouro para criar senhas

- **Use senhas longas e exclusivas** para cada serviço.
- **Evite dados óbvios** como nomes, datas de nascimento, times de futebol ou sequências numéricas (123456).
- **Nunca compartilhe sua senha**, mesmo que alguém alegue ser do suporte técnico ou seu gestor.
- **Utilize gerenciadores de senha** autorizados para armazenar suas credenciais com segurança.`,
    ordem: 2,
  },
  {
    id: 'c3d4e5f6-7890-abcd-ef01-23456789abcd',
    titulo: '02. Autenticação em Dois Fatores (2FA)',
    conteudo: `## O que é 2FA?
A Autenticação em Dois Fatores adiciona uma camada extra de proteção além da senha. Mesmo que alguém descubra sua senha, precisará do segundo fator para entrar.

## Como funciona na prática

1. **Primeiro fator:** sua senha secreta.
2. **Segundo fator:** um código gerado por aplicativo autenticador (como Google Authenticator) ou chave física.

## Cuidados essenciais

- **Nunca repasse códigos** que chegam por SMS ou aplicativos para terceiros.
- **Desconfie de notificações de login** que você não solicitou — isso pode indicar que alguém está tentando adivinhar sua senha.`,
    ordem: 3,
  },
  {
    id: 'd4e5f6a7-8901-bcde-f012-3456789abcde',
    titulo: '03. Segurança em redes Wi-Fi públicas',
    conteudo: `## Os riscos de redes abertas
Redes Wi-Fi de cafés, aeroportos, hotéis e shoppings não são criptografadas por padrão, permitindo que atacantes interceptem o tráfego de dados.

## Boas práticas em trânsito

- **Evite transações sensíveis** (como internet banking ou senhas corporativas) em Wi-Fi público sem uso de uma VPN confiável.
- **Desative a conexão automática** do seu smartphone e notebook para redes abertas desconhecidas.
- **Valide o nome exato da rede** com o estabelecimento para não cair em redes falsas criadas por golpistas.`,
    ordem: 4,
  },
  {
    id: 'e5f6a7b8-9012-cdef-0123-456789abcdef',
    titulo: '04. Introdução à Engenharia Social',
    conteudo: `## O que é Engenharia Social?
É a manipulação psicológica de pessoas para induzi-las a entregar dados confidenciais ou realizar ações perigosas, explorando emoções como medo, urgência, curiosidade ou autoridade.

## Gatilhos mais comuns

- **Urgência:** "Sua conta será bloqueada em 10 minutos se você não clicar aqui."
- **Autoridade:** "Fale com o diretor financeiro imediatamente."
- **Curiosidade:** "Veja a lista de cortes de pessoal deste mês."

## Pare → Pense → Verifique
Sempre que receber uma solicitação atípica, valide a identidade do remetente por um canal oficial antes de agir ou repassar informações.`,
    ordem: 5,
  },
  {
    id: 'f7a8b9c0-1234-4def-8abc-567890123456',
    titulo: '05. Análise de pacotes e tráfego com Wireshark',
    conteudo: `## Objetivo da prática
Nesta aula, você vai usar o Wireshark para observar o tráfego gerado por um ambiente autorizado de testes e reconhecer requisições DNS e conexões HTTPS. Faça a captura apenas em redes, dispositivos e contas sob sua autorização.

## Preparação

1. Instale o Wireshark a partir do site oficial.
2. Selecione a interface de rede em uso (Wi-Fi ou Ethernet).
3. Inicie a captura e acesse um site de teste pelo navegador.
4. Pare a captura após alguns segundos para reduzir o volume de dados.

## Filtros úteis

Use a barra de filtros do Wireshark para investigar protocolos específicos:

\`\`\`
dns
tcp.port == 443
ip.addr == 8.8.8.8
\`\`\`

O filtro \`dns\` mostra consultas e respostas de nomes. O filtro \`tcp.port == 443\` ajuda a identificar conexões HTTPS; o conteúdo da navegação continua protegido por TLS, o que é esperado.

## Análise prática

- Selecione uma consulta DNS e verifique o domínio solicitado e o endereço IP retornado.
- Observe o handshake TLS em uma conexão HTTPS, procurando mensagens como \`Client Hello\` e \`Server Hello\`.
- Compare os horários dos pacotes com sua ação no navegador para relacionar comportamento e tráfego.

## Boas práticas
Não compartilhe arquivos de captura (PCAP) sem revisão: eles podem conter metadados, domínios acessados e outros dados sensíveis. Em contexto corporativo, siga a política de monitoramento e guarde evidências somente nos repositórios aprovados.`,
    ordem: 6,
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
      nivel: 'BASICO',
      bloqueada: false,
      ordem: 1,
    },
    create: {
      id: TRILHA_ID,
      titulo: 'Segurança Digital Básica',
      descricao: 'Aprenda práticas essenciais para proteger seus dados.',
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
