export const moduloBasico = {
  titulo: 'Seus dados na internet',
  descricao: 'Entenda onde seus dados aparecem e escolha o que compartilhar, permitir e revisar.',
};

type Lesson = {
  id: string; title: string; concept: string; story: string; practice: string;
  nodes: string[]; notes: string[]; question: string; options: string[];
  correct: number; explanation: string; takeaway: string; image: string; alt: string;
  video: { title: string; file: string; slug: string; prompt: string };
};

const lessons: Lesson[] = [
  {
    id: 'a7f6e51b-12f2-4c21-8119-38921db26a96', title: '01. O que seus dados contam sobre você?',
    concept: 'Seu nome, uma foto, seu e-mail e sua localização podem revelar quem você é. Mesmo informações pequenas podem dizer bastante quando aparecem juntas.\n\nProteger sua privacidade começa por perceber **quais informações você entrega**. Uma loja precisa do endereço para entregar uma compra. A pergunta é se aquele dado faz sentido para aquela tarefa.',
    story: 'Ana quer receber um material por e-mail. O cadastro pede nome, e-mail, endereço de casa e foto do documento. Os dois últimos pedidos não parecem necessários para enviar um arquivo. Ela procura a finalidade da coleta e escolhe outro material quando não encontra uma explicação clara.',
    practice: 'Imagine um cadastro para receber uma receita por e-mail. Quais dados fariam sentido? Compare com uma compra que precisa ser entregue: o que muda e por quê?',
    nodes: ['Um dado', 'Outros detalhes', 'Uma pessoa'], notes: ['Nome ou fotografia', 'Local, rotina e contatos', 'Juntos, podem identificar você'],
    question: 'Para receber um PDF por e-mail, um site pede uma foto do documento. O que fazer primeiro?',
    options: ['Enviar tudo para terminar logo.', 'Verificar por que esse dado é necessário.', 'Informar o documento de outra pessoa.'], correct: 1,
    explanation: 'O pedido precisa fazer sentido para a finalidade. Sem uma explicação clara, não envie o documento. Usar dados de outra pessoa também não resolve o problema.',
    takeaway: 'Antes de informar um dado, pergunte: por que precisam disso? Na próxima aula, veremos os dados que ficam pelo caminho mesmo sem preencher um cadastro.',
    image: 'dados', alt: 'Perfil fictício de Ana conectado a cartões de nome, contato e localização: juntos, os dados contam sobre uma pessoa.',
    video: { title: 'Por que meus dados pessoais são importantes?', file: '127/121-DadosPessoaisSaoImportantes-720p_site.mp4', slug: 'por-que-meus-dados-pessoais-sao-importantes', prompt: 'Que informações do cotidiano podem ajudar a identificar uma pessoa?' },
  },
  {
    id: 'c3d4e5f6-7890-abcd-ef01-23456789abcd', title: '02. O que fica registrado quando você navega?',
    concept: 'Além do que você escreve, o uso de um site pode gerar registros, como páginas visitadas e preferências. Esse conjunto faz parte dos seus **rastros digitais**.\n\nCookies são pequenos dados guardados pelo navegador. Alguns ajudam a manter uma sessão ou carrinho de compras; outros podem apoiar publicidade e acompanhamento da navegação. Leia as categorias e ajuste o que for opcional.',
    story: 'Ana visita uma loja e vê um aviso de cookies. Em vez de aceitar tudo por pressa, abre as preferências. Distingue o que mantém a loja funcionando do que é opcional para anúncios. Ela também aprende que uma janela anônima não a torna invisível para sites ou para a rede.',
    practice: 'Localize a área de privacidade do seu navegador e encontre as opções de cookies e histórico. Não é necessário mudar nada. O caminho varia entre navegadores.',
    nodes: ['Você navega', 'Registros ficam', 'Você revisa'], notes: ['Visita páginas e escolhe produtos', 'Sessão, preferências e outros usos', 'Confira categorias e finalidade'],
    question: 'Um aviso oferece cookies necessários e opcionais para publicidade. O que faz sentido?',
    options: ['Tratar todo cookie como vírus.', 'Acreditar que o modo anônimo impede qualquer rastreamento.', 'Ler as finalidades e ajustar os opcionais.'], correct: 2,
    explanation: 'Cookies têm usos diferentes. Revisar as opções ajuda a decidir sobre os opcionais. Isso não elimina todos os registros: sites e redes ainda podem observar atividade, inclusive no modo anônimo.',
    takeaway: 'Nem todo rastro vem de uma publicação. Na próxima aula, Ana vai escolher quais informações quer mostrar aos outros.',
    image: 'rastros', alt: 'Navegador fictício ligado a cartões de sessão, preferências e publicidade: cada registro tem uma finalidade.',
    video: { title: 'Cookies do navegador', file: '53/47-Cookies-720p_site.mp4', slug: 'cookies-do-navegador', prompt: 'Identifique um uso que facilita a navegação e outro que merece uma decisão de privacidade.' },
  },
  {
    id: 'd4e5f6a7-8901-bcde-f012-3456789abcde', title: '03. Antes de publicar: o que aparece na foto?',
    concept: 'Uma foto pode mostrar mais do que você pretendia: endereço ao fundo, crachá ou documento. A legenda também pode revelar horários e rotina.\n\nConfira **o conteúdo e quem poderá vê-lo**. Restringir o público reduz a exposição, mas não impede que alguém salve uma cópia. Cuide também dos dados de outras pessoas na imagem.',
    story: 'Ana tira uma foto para contar que vai viajar. Ao revisar, vê um cartão de embarque e o endereço em uma encomenda. Ela refaz a foto sem esses itens, escolhe um público menor e evita publicar sua localização em tempo real.',
    practice: 'Observe a ilustração fictícia desta aula. Identifique dois detalhes que retiraria da foto antes de publicar. Não precisa abrir nem enviar uma foto sua.',
    nodes: ['Confira a foto', 'Escolha o público', 'Pense nas cópias'], notes: ['Há endereço ou documentos?', 'Quem precisa ver?', 'Alguém pode salvar e encaminhar'],
    question: 'Sua foto mostra um documento sobre a mesa. O que fazer antes de publicar?',
    options: ['Refazer ou recortar a foto e revisar o público.', 'Publicar porque só conhecidos seguem o perfil.', 'Apagar depois de alguns minutos.'], correct: 0,
    explanation: 'Retirar os dados antes evita uma exposição desnecessária. Público menor ajuda, mas ainda pode haver cópias. Apagar depois não garante que ninguém tenha salvo.',
    takeaway: 'Revise o que aparece e para quem vai. Na próxima aula, veremos outro compartilhamento: o acesso que os aplicativos recebem.',
    image: 'publicacao', alt: 'Foto fictícia de viagem com um documento e um endereço destacados: detalhes que devem sair do enquadramento.',
    video: { title: 'Tome cuidado com as informações que você compartilha', file: '43/41-CuidadoComInformacoesqueCompartilha-720p_site.mp4', slug: 'seguranca/tome-cuidado-com-as-informacoes-que-voce-compartilha', prompt: 'Que detalhes revelam informações pessoais sem a pessoa perceber?' },
  },
  {
    id: 'e5f6a7b8-9012-cdef-0123-456789abcdef', title: '04. Quem pode acessar seus dados no celular?',
    concept: 'Permissão é uma autorização para um aplicativo usar câmera, contatos, microfone ou localização. Pergunte: **esse acesso combina com a função que estou usando agora?**\n\nUm mapa pode precisar da localização durante uma rota. Uma calculadora normalmente não precisa dela. Você pode revisar os acessos nas configurações. As opções variam conforme o aparelho; negar um acesso necessário pode limitar uma função.',
    story: 'Ana abre um editor de fotos que pede acesso aos contatos. Ela não vê relação entre a edição e a lista de pessoas, então nega o pedido. Ao selecionar a imagem, procura uma opção de acesso apenas às fotos escolhidas, se disponível.',
    practice: 'Localize as permissões de um aplicativo seu. Escolha uma e pense na função que justifica o acesso. Não precisa desativar nada para concluir.',
    nodes: ['O app pede', 'Você compara', 'Você decide'], notes: ['Um recurso ou informação', 'É necessário para essa função?', 'Permita o necessário e revise depois'],
    question: 'Uma calculadora pede localização para fazer uma soma. Qual atitude faz sentido?',
    options: ['Autorizar qualquer pedido do aplicativo.', 'Questionar a necessidade e negar se não houver justificativa.', 'Dar acesso aos contatos também.'], correct: 1,
    explanation: 'A permissão precisa ter relação com a função. Instalar um aplicativo não significa autorizar qualquer coleta. Revise a finalidade e procure uma alternativa se o pedido não fizer sentido.',
    takeaway: 'Compartilhar dados também acontece quando você permite acesso. Na última aula, vamos juntar essas escolhas em um plano simples.',
    image: 'permissoes', alt: 'Painel fictício de mapas com localização durante o uso e acesso a contatos e microfone desativado.',
    video: { title: 'Permissões de aplicativos', file: '71/65-Celulares-PermissoesApps-720p_site.mp4', slug: 'permissoes-de-aplicativos', prompt: 'Escolha um exemplo de acesso necessário e outro que parece excessivo.' },
  },
  {
    id: 'f7a8b9c0-1234-4def-8abc-567890123456', title: '05. Seu plano de privacidade em três escolhas',
    concept: 'Você pode revisar suas escolhas de privacidade aos poucos. Comece com três perguntas: **o que estou entregando, para quem e para quê?**\n\nNa política de privacidade, procure quais dados o serviço coleta, a finalidade e com quem compartilha. Nas configurações, revise público e permissões. Isso ajuda a reduzir exposição, mas não desfaz cópias já recebidas por outras pessoas.',
    story: 'Ana retoma a jornada: questiona um campo no cadastro, revisa cookies opcionais, refaz uma foto com documentos e confere permissões. Em vez de tentar resolver tudo de uma vez, escolhe revisar uma configuração por semana.',
    practice: 'Monte um plano de três ações: um cadastro para revisar, uma opção de público para conferir e uma permissão para entender. Anote só as ações, sem dados pessoais, senhas ou capturas.',
    nodes: ['O que entrego?', 'Quem recebe?', 'Para qual uso?'], notes: ['Dados e detalhes do cotidiano', 'Público, aplicativo ou serviço', 'Uma finalidade que você entende'],
    question: 'Ana quer revisar sua privacidade sem se perder. Qual plano é mais útil?',
    options: ['Aceitar todos os pedidos para acabar logo.', 'Apagar uma publicação e presumir que todas as cópias sumiram.', 'Revisar um cadastro, o público das publicações e uma permissão.'], correct: 2,
    explanation: 'O plano retoma o mesmo tema em três pontos: coleta, publicação e acesso. Faça uma mudança por vez e confira o efeito. Nenhuma configuração garante a eliminação de cópias já feitas.',
    takeaway: 'Você já sabe reconhecer dados, perceber rastros e revisar o compartilhamento. Os próximos módulos aprofundam a proteção de contas e outros cuidados específicos.',
    image: 'plano', alt: 'Lista de privacidade com três tarefas: revisar cadastro, escolher público e conferir permissões.',
    video: { title: 'Políticas de Privacidade', file: '59/53-PoliticasDePrivacidade-720p_site.mp4', slug: 'politicas-de-privacidade', prompt: 'O que você procuraria antes de fornecer dados a um serviço?' },
  },
];

export const aulasBasicas = lessons.map((lesson, index) => ({
  id: lesson.id, titulo: lesson.title, ordem: index + 2,
  conteudo: JSON.stringify({
    format: 'cybereduca-lesson-v1', title: lesson.title,
    level: 'BASICO',
    concept: index === 1
      ? 'Um site pode lembrar escolhas, produtos vistos e preferências. Algumas informações ajudam a compra a funcionar; outras servem para anúncios. Você pode conferir as opções em vez de aceitar tudo por pressa.\n\nUma janela de navegação privada não esconde tudo dos sites e da rede. O importante nesta aula é perceber que usar um serviço também pode deixar registros.'
      : lesson.concept,
    caseStudy: lesson.story.replace(/cookies opcionais/g, 'opções de publicidade').replace(/cookies/g, 'preferências de navegação'),
    practice: 'Observe a ilustração e a situação desta página. Escolha uma alternativa na atividade e leia a explicação aqui no site. Você não precisa abrir suas contas, mudar configurações ou enviar arquivos.',
    objectives: [[
      'Reconhecer dados pessoais e questionar pedidos desnecessários.',
      'Entender os registros da navegação e revisar cookies opcionais.',
      'Revisar uma imagem e seu público antes de compartilhar.',
      'Relacionar permissões à função de cada aplicativo.',
      'Montar um plano simples para revisar sua privacidade.',
    ][index]],
    source: 'https://cartilha.cert.br/fasciculos/privacidade/fasciculo-privacidade.pdf',
    sourceTitle: 'CERT.br — Privacidade',
    diagram: { title: 'Veja a ideia em três passos', nodes: lesson.nodes, notes: lesson.notes, caption: 'Cada escolha acompanha o mesmo tema: o cuidado com seus dados.' },
    video: { title: lesson.video.title, url: `https://cidadaonarede.nic.br/download/files/downloads/${lesson.video.file}`, source: `https://cidadaonarede.nic.br/pt/videos/${lesson.video.slug}`, prompt: lesson.video.prompt },
    introductory: {
      step: index + 1,
      image: { src: `/images/modulo-1/${lesson.image}.svg`, alt: lesson.alt, caption: 'Exemplo fictício para observar os detalhes da aula.' },
      checkpoint: { question: lesson.question.replace(/cookies/g, 'registros'), options: lesson.options.map(option => option.replace(/cookie/g, 'registro')), correct: lesson.correct, explanation: lesson.explanation.replace(/Cookies/g, 'Esses registros').replace(/cookies/g, 'registros') },
      takeaway: lesson.takeaway,
    },
  }),
}));
