// Conteúdo editorial original. As referências são leituras complementares oficiais.
import { expandCourses } from "./course-expansion";
import { enrichFoundations } from "./lesson-foundations";
import { applyLearningLevels } from './learning-levels';
export type CourseLevel = "BASICO" | "INTERMEDIARIO" | "AVANCADO";
export const levelNames = {
  BASICO: "Básico",
  INTERMEDIARIO: "Intermediário",
  AVANCADO: "Avançado",
};
type Topic = [
  title: string,
  concept: string,
  practice: string,
  question: string,
  correct: string,
  wrong: string,
  explanation: string,
];
export type LibraryLesson = {
  id: string;
  title: string;
  concept: string;
  practice: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  source: string;
  sourceTitle: string;
  caseStudy?: string;
  expected?: string;
  objectives?: string[];
};
export type LibraryCourse = {
  id: string;
  title: string;
  level: CourseLevel;
  description: string;
  lessons: LibraryLesson[];
};
const cert = (name: string) =>
  `https://cartilha.cert.br/fasciculos/${name}/fasciculo-${name}.pdf`;
const owasp = (name: string) => `https://top10.owasp.org/2025/${name}/`;
function course(
  id: string,
  title: string,
  level: CourseLevel,
  description: string,
  source: string,
  sourceTitle: string,
  topics: Topic[],
): LibraryCourse {
  return {
    id: `biblioteca-${id}`,
    title,
    level,
    description,
    lessons: topics.map((t, i) => ({
      id: `aula-${i + 1}`,
      title: t[0],
      concept: t[1],
      practice: t[2],
      question: t[3],
      options: i % 2 ? [t[5], t[4]] : [t[4], t[5]],
      correct: i % 2 ? 1 : 0,
      explanation: t[6],
      source,
      sourceTitle,
    })),
  };
}
export const libraryCourses: LibraryCourse[] = [
  course(
    "contas",
    "Senhas, autenticação e recuperação",
    "BASICO",
    "Proteja suas contas e aprenda a recuperar o acesso com segurança.",
    cert("autenticacao"),
    "CERT.br — Autenticação",
    [
      [
        "Senhas únicas e gerenciadores",
        "Repetir uma senha transforma o vazamento de um serviço em risco para outros. Use uma senha longa e exclusiva por conta; um gerenciador ajuda a criá-las e guardá-las. A senha do próprio gerenciador merece proteção especial.",
        "Desenhe um inventário de cinco contas, sem escrever senhas. Marque onde há reutilização e planeje a substituição.",
        "Uma senha usada em três serviços vazou. Qual é a melhor resposta?",
        "Substituí-la em todos os serviços em que foi reutilizada.",
        "Alterar apenas no serviço que anunciou o vazamento.",
        "O atacante pode testar a mesma credencial em outros serviços.",
      ],
      [
        "Segunda etapa de verificação",
        "A autenticação multifator adiciona uma barreira além da senha. Prefira métodos resistentes a phishing quando disponíveis, como chaves de segurança. Não aprove solicitações de login que você não iniciou e nunca repasse códigos recebidos.",
        "Localize a opção de verificação em duas etapas em uma conta sua. Leia os métodos disponíveis sem compartilhar seus códigos.",
        "Chegou uma aprovação de login que você não iniciou. O que fazer?",
        "Negar e investigar a atividade da conta.",
        "Aprovar para a notificação desaparecer.",
        "Aprovar pode autorizar o acesso de outra pessoa.",
      ],
      [
        "Recuperação sem improviso",
        "A recuperação também é uma porta de entrada. Mantenha os contatos atualizados e os códigos de reserva protegidos. O e-mail principal merece cuidado porque frequentemente redefine o acesso a outras contas.",
        "Escreva um plano para perda do celular: canal de recuperação, local dos códigos de reserva e dispositivo alternativo.",
        "Onde guardar códigos de recuperação?",
        "Em local protegido que continue acessível se o celular for perdido.",
        "Somente em uma captura de tela no celular que será usado para autenticar.",
        "Uma cópia protegida e independente evita depender do dispositivo perdido.",
      ],
    ],
  ),
  course(
    "golpes",
    "Phishing e engenharia social",
    "BASICO",
    "Reconheça mensagens enganosas, pressão e pedidos fora de contexto.",
    cert("golpes"),
    "CERT.br — Golpes",
    [
      [
        "Urgência e autoridade",
        "Golpistas exploram medo, curiosidade e suposta autoridade. Uma mensagem que ameaça bloquear sua conta em minutos tenta reduzir seu tempo de análise. Pare e confirme o pedido por um canal conhecido.",
        "Escreva duas respostas seguras para uma mensagem que pede pagamento urgente em nome de um gestor.",
        "Uma mensagem pede segredo e transferência imediata. Qual ação ajuda?",
        "Confirmar por outro canal já conhecido.",
        "Responder à própria mensagem pedindo confirmação.",
        "Um canal independente reduz a chance de conversar com o próprio fraudador.",
      ],
      [
        "Remetentes, links e contexto",
        "Nome e logotipo podem ser copiados. Leia o endereço completo e considere se você esperava a mensagem. Endereços parecidos e anexos inesperados merecem verificação; aparência profissional não comprova autenticidade.",
        "Compare loja.example com loja.example.conta.invalid. Identifique qual parte muda a organização que controla o endereço.",
        "Um logotipo conhecido comprova a origem do e-mail?",
        "Não; é necessário verificar origem, endereço e contexto.",
        "Sim, marcas impedem a cópia de seus logotipos.",
        "Elementos visuais são fáceis de reproduzir.",
      ],
      [
        "Quando você já interagiu",
        "Não esconda uma interação suspeita. Registre o que aconteceu e procure o suporte responsável. Se informou uma senha, use um dispositivo confiável para alterá-la e revisar sessões. Em ambiente de trabalho, siga o procedimento de incidentes.",
        "Monte uma linha do tempo fictícia com horário, mensagem recebida, ação realizada e informação fornecida.",
        "Após informar uma senha em uma página suspeita, o melhor é:",
        "Comunicar o ocorrido e proteger a conta por canais oficiais.",
        "Aguardar alguns dias para ver se algo acontece.",
        "A resposta rápida pode reduzir o impacto da credencial exposta.",
      ],
    ],
  ),
  course(
    "dispositivos",
    "Celular e computador protegidos",
    "BASICO",
    "Atualizações, aplicativos e cuidados que cabem na rotina.",
    cert("celulares-e-tablets"),
    "CERT.br — Celulares e tablets",
    [
      [
        "Atualizações de segurança",
        "Correções fecham falhas conhecidas. Adiar todas as atualizações mantém riscos desnecessários. Use os mecanismos oficiais do sistema, observe o período de suporte e planeje reinicializações.",
        "Verifique a versão e o estado das atualizações de um dispositivo seu. Registre apenas se há pendências.",
        "Uma atualização deve ser instalada a partir de:",
        "Configurações oficiais do sistema ou canal confiável do fabricante.",
        "Um anúncio que afirma ter detectado centenas de vírus.",
        "Anúncios alarmistas podem distribuir aplicativos falsos.",
      ],
      [
        "Permissões de aplicativos",
        "Permissões devem acompanhar a função do aplicativo. Acesso a contatos, câmera ou localização sem necessidade aumenta a exposição. Revise permissões e remova aplicativos sem uso.",
        "Escolha três aplicativos e compare a finalidade de cada um com suas permissões. Não publique capturas com dados pessoais.",
        "Uma calculadora pede acesso permanente à localização. Você deve:",
        "Questionar a necessidade e negar o acesso desnecessário.",
        "Aceitar porque qualquer pedido do aplicativo é obrigatório.",
        "Permissões devem ser justificadas pela funcionalidade.",
      ],
      [
        "Bloqueio e perda do aparelho",
        "O bloqueio de tela dificulta o acesso físico indevido. Prepare recursos de localização e recuperação antes de uma perda. Evite deixar sessões abertas em dispositivos compartilhados.",
        "Descreva como localizar as opções de bloqueio automático e recuperação do seu aparelho.",
        "Ao sair de perto de um computador desbloqueado, você deve:",
        "Bloquear a sessão.",
        "Apenas minimizar as janelas.",
        "Minimizar não impede outra pessoa de acessar a sessão.",
      ],
    ],
  ),
  course(
    "backup",
    "Backup e proteção de arquivos",
    "BASICO",
    "Prepare cópias e descubra se consegue restaurá-las.",
    cert("backup"),
    "CERT.br — Backup",
    [
      [
        "Cópia não é só sincronização",
        "Sincronização facilita acesso, mas pode propagar exclusões. Um backup precisa permitir recuperar versões adequadas. Mantenha cópias separadas do dispositivo principal e proteja o acesso a elas.",
        "Liste três arquivos importantes e onde cada um poderia ser recuperado após uma exclusão acidental.",
        "Uma pasta sincronizada garante recuperação de qualquer exclusão?",
        "Não; é preciso conferir retenção e versões recuperáveis.",
        "Sim, sincronização é sempre um backup completo.",
        "A política de retenção determina o que ainda pode ser restaurado.",
      ],
      [
        "Planejar frequência e proteção",
        "A frequência deve acompanhar a quantidade de trabalho que você aceita perder. Cópias também podem conter informações privadas: escolha quem acessa e como protegê-las.",
        "Para um trabalho alterado diariamente, defina uma frequência de cópia e explique o impacto de perder um dia.",
        "O que orienta a frequência de backup?",
        "A importância dos dados e a perda aceitável entre cópias.",
        "Somente a capacidade do disco.",
        "O intervalo deve refletir a necessidade de recuperação.",
      ],
      [
        "Testar a restauração",
        "Um backup ainda não testado é uma hipótese. Restaure um arquivo de teste em outra pasta e compare o conteúdo. Registre o procedimento para não improvisar durante uma falha.",
        "Crie um arquivo sem dados pessoais, faça uma cópia e restaure em outra pasta. Não exclua o original.",
        "Como confirmar que uma cópia é utilizável?",
        "Realizar uma restauração controlada e verificar o arquivo.",
        "Ver apenas se o nome da pasta de backup existe.",
        "A existência de uma pasta não demonstra que os dados estão íntegros.",
      ],
    ],
  ),
  course(
    "redes",
    "Redes e navegação consciente",
    "INTERMEDIARIO",
    "Entenda a rede doméstica, conexões e separação de dispositivos.",
    cert("redes"),
    "CERT.br — Redes",
    [
      [
        "Administração do roteador",
        "O painel administrativo controla a rede e não deve usar credenciais padrão. Mantenha firmware suportado, limite a administração remota e registre mudanças para poder revisá-las.",
        "Localize o manual do modelo do seu roteador. Identifique como o fabricante entrega atualizações.",
        "Qual senha merece ser alterada ao configurar um roteador?",
        "A credencial administrativa padrão.",
        "Apenas o nome visível da rede.",
        "O nome da rede não protege a interface de administração.",
      ],
      [
        "Visitantes e dispositivos conectados",
        "Separar equipamentos de visitantes pode limitar acesso a recursos internos. A separação precisa ser configurada e verificada; apenas criar outro nome de Wi-Fi não prova isolamento.",
        "Desenhe uma rede doméstica com computadores, dispositivos inteligentes e visitantes em grupos separados.",
        "Duas redes com nomes diferentes estão necessariamente isoladas?",
        "Não; é necessário verificar as regras de comunicação.",
        "Sim; o nome diferente já impede acesso entre elas.",
        "O isolamento depende da configuração, não apenas do nome.",
      ],
      [
        "Cuidado em redes compartilhadas",
        "Evite aprovar avisos inesperados de conexão. Confira o nome da rede e use serviços com proteção de transporte. Uma rede conhecida também pode ter dispositivos comprometidos: mantenha os demais controles.",
        "Descreva como confirmar com o estabelecimento qual rede é oficial, sem usar senhas de terceiros.",
        "O que fazer diante de um aviso de certificado inesperado?",
        "Interromper e verificar a causa antes de continuar.",
        "Ignorar sempre porque redes públicas exibem avisos normais.",
        "O aviso pode indicar que a identidade do destino não foi validada.",
      ],
    ],
  ),
  course(
    "privacidade",
    "Privacidade e compartilhamento",
    "INTERMEDIARIO",
    "Reduza exposição e compartilhe apenas o necessário.",
    cert("privacidade"),
    "CERT.br — Privacidade",
    [
      [
        "Minimização de dados",
        "Quanto mais dados são coletados e compartilhados, maior a exposição potencial. Pergunte a finalidade antes de preencher um cadastro. Informações públicas também podem ser combinadas para criar perfis.",
        "Crie um cadastro fictício e retire os campos que não são necessários para sua finalidade.",
        "Um cadastro pede dados sem explicar a finalidade. Você deve:",
        "Questionar a necessidade antes de fornecer.",
        "Preencher tudo porque dados isolados nunca causam risco.",
        "A combinação de informações pode ampliar a exposição.",
      ],
      [
        "Links e permissões",
        "Um link compartilhado pode alcançar pessoas além do destinatário. Prefira acesso restrito quando necessário e revise os participantes. Encaminhamento e capturas também podem ampliar o público.",
        "Compare um documento público com outro restrito a duas pessoas. Defina qual opção serve para um relatório interno.",
        "Para um documento interno, a melhor configuração inicial é:",
        "Acesso restrito às pessoas necessárias.",
        "Qualquer pessoa com o link pode editar.",
        "Permissões limitadas reduzem exposição e alterações indevidas.",
      ],
      [
        "Revisão da presença digital",
        "Publicações antigas, perfis e aplicativos conectados podem revelar hábitos. Revise o público de cada informação e remova conexões desnecessárias. Apagar uma publicação não garante remover cópias já feitas.",
        "Faça um inventário privado de três perfis e indique quais informações deveriam ter público limitado.",
        "Apagar uma postagem elimina todas as cópias?",
        "Não; terceiros podem ter guardado ou republicado.",
        "Sim; apagar na origem remove automaticamente da internet.",
        "Cópias externas podem permanecer fora do seu controle.",
      ],
    ],
  ),
  course(
    "malware",
    "Malware e resposta inicial",
    "INTERMEDIARIO",
    "Reconheça riscos de arquivos, programas e comportamentos anormais.",
    cert("codigos-maliciosos"),
    "CERT.br — Códigos maliciosos",
    [
      [
        "Malware e sinais de alerta",
        "Malware é um conjunto de programas com comportamentos prejudiciais. Lentidão isolada não confirma infecção; observe alertas e contexto. Mantenha proteção atualizada e procure suporte para investigar.",
        "Monte uma ficha fictícia com sintomas, horário e mudanças recentes. Separe fatos de suposições.",
        "Lentidão, sozinha, comprova malware?",
        "Não; é um sintoma que precisa de investigação.",
        "Sim; qualquer computador lento está infectado.",
        "Várias causas podem produzir o mesmo comportamento.",
      ],
      [
        "Anexos e instalações",
        "Arquivos inesperados e instaladores não oficiais podem conter programas maliciosos. Uma conta conhecida pode ter sido invadida. Confirme o envio por outro canal antes de executar algo fora do contexto.",
        "Descreva uma verificação para um anexo que você não esperava receber. Não abra arquivos reais suspeitos.",
        "Um colega enviou um instalador inesperado. Qual ação ajuda?",
        "Confirmar o envio por outro canal e verificar a origem.",
        "Executar porque o remetente é conhecido.",
        "Uma origem conhecida não exclui comprometimento da conta.",
      ],
      [
        "Privilégios e contenção",
        "Um programa herda permissões do contexto em que executa. Usar privilégios elevados sem necessidade aumenta o dano possível. Diante de suspeita em equipamento corporativo, comunique a equipe responsável.",
        "Liste atividades comuns que não precisam de conta administrativa e explique por quê.",
        "Por que evitar conta administrativa no uso diário?",
        "Para reduzir o alcance de erros e programas maliciosos.",
        "Porque uma conta comum impede todos os ataques.",
        "Privilégio mínimo limita impacto, mas não elimina todos os riscos.",
      ],
    ],
  ),
  course(
    "remoto-ia",
    "Trabalho remoto e uso de IA",
    "INTERMEDIARIO",
    "Proteja o ambiente de trabalho e revise o uso de assistentes digitais.",
    cert("trabalho-remoto"),
    "CERT.br — Trabalho remoto",
    [
      [
        "Ambiente e equipamentos",
        "Trabalho remoto exige separar usos pessoais e profissionais conforme a política da organização. Proteja telas, arquivos e dispositivos compartilhados. O ambiente físico também influencia quem pode ver ou ouvir informações.",
        "Desenhe um espaço de trabalho e marque os pontos de exposição da tela e de documentos.",
        "Em um local compartilhado, um cuidado relevante é:",
        "Evitar exposição da tela e bloquear a sessão ao se afastar.",
        "Confiar que ninguém prestará atenção.",
        "A proteção inclui o ambiente físico.",
      ],
      [
        "Solicitações de suporte",
        "Uma pessoa que se apresenta como suporte ainda precisa ser verificada. Acesso remoto concede controle significativo. Confirme a solicitação pelo canal oficial antes de instalar ferramentas ou autorizar sessões.",
        "Escreva um procedimento para confirmar um chamado de suporte inesperado.",
        "Um contato pede acesso remoto sem chamado. Você deve:",
        "Confirmar a identidade pelo suporte oficial antes de autorizar.",
        "Autorizar para resolver rapidamente.",
        "A alegação de suporte não comprova autorização.",
      ],
      [
        "Dados e respostas de IA",
        "Antes de enviar um texto a um assistente, retire informações confidenciais. Respostas podem conter erros e precisam de revisão. Limite as ações automáticas e confira a origem das instruções recebidas.",
        "Crie um exemplo fictício de solicitação e substitua nomes, chaves e dados internos por marcadores.",
        "Uma resposta de IA com referências deve ser:",
        "Conferida nas fontes antes de ser usada.",
        "Aceita sem revisão porque contém links.",
        "Referências e conclusões podem estar incorretas.",
      ],
    ],
  ),
  course(
    "acesso",
    "Controle de acesso em aplicações",
    "AVANCADO",
    "Diferencie autenticação de autorização e revise o acesso a objetos.",
    owasp("A01_2025-Broken_Access_Control"),
    "OWASP Top 10:2025 — Controle de acesso",
    [
      [
        "Autenticar não é autorizar",
        "Saber quem fez login não define tudo que essa pessoa pode fazer. Cada operação protegida deve verificar a permissão adequada no servidor. Esconder um botão não substitui essa verificação.",
        "Desenhe uma matriz com aluno, instrutor e administrador e três operações permitidas para cada papel.",
        "Esconder um botão administrativo impede chamadas à API?",
        "Não; a autorização deve existir no servidor.",
        "Sim; sem o botão não há como enviar a requisição.",
        "A interface não é a fronteira de autorização.",
      ],
      [
        "Acesso a objetos",
        "Um identificador difícil de adivinhar não é uma regra de acesso. Uma solicitação a um documento precisa validar se o usuário pode acessar aquele objeto, mesmo quando o ID é um UUID.",
        "Em um sistema fictício, descreva como verificar o proprietário de um documento antes de retorná-lo.",
        "Um UUID substitui a validação de propriedade?",
        "Não; o servidor ainda precisa verificar o acesso ao objeto.",
        "Sim; UUIDs são impossíveis de obter.",
        "Conhecer um identificador não concede autorização.",
      ],
      [
        "Negar por padrão",
        "Novas operações devem começar restritas e receber permissões explícitas. Revise controles após mudanças de papel e teste casos de usuários diferentes. A política deve valer de forma consistente.",
        "Crie casos de teste de autorização para leitura, edição e exclusão em um aplicativo fictício.",
        "Uma rota nova deve começar com qual política?",
        "Negar acesso até que a permissão necessária seja definida.",
        "Liberar para todos até alguém relatar problema.",
        "Negar por padrão reduz exposição acidental.",
      ],
    ],
  ),
  course(
    "configuracao",
    "Configuração e cadeia de software",
    "AVANCADO",
    "Reduza exposição de ambientes e dependências.",
    owasp("A02_2025-Security_Misconfiguration"),
    "OWASP Top 10:2025 — Configuração",
    [
      [
        "Configuração mínima",
        "Serviços e recursos desnecessários aumentam a superfície exposta. Revise contas padrão, modos de depuração e interfaces administrativas. Compare a configuração real com uma base documentada.",
        "Monte uma checklist de lançamento de um aplicativo fictício, incluindo erros, contas e serviços expostos.",
        "Modo de depuração detalhado deve ficar público em produção?",
        "Não; detalhes internos devem ser restritos.",
        "Sim; facilita a vida de qualquer visitante.",
        "Detalhes internos podem ajudar a compreender e atacar o ambiente.",
      ],
      [
        "Segredos fora do cliente",
        "Qualquer segredo entregue ao navegador pode ser observado pelo usuário. Chaves de provedores devem permanecer no serviço responsável e ter escopo limitado. Evite registrar credenciais em logs.",
        "Desenhe o caminho de uma consulta externa: navegador, seu servidor e provedor. Marque onde a chave deve existir.",
        "Uma chave privada pode ser protegida apenas ofuscando JavaScript?",
        "Não; ela deve permanecer fora do código enviado ao navegador.",
        "Sim; basta remover o nome da variável.",
        "Ofuscação não transforma dados do cliente em segredo.",
      ],
      [
        "Dependências e procedência",
        "Bibliotecas e ferramentas entram na cadeia de confiança. Registre versões, confira procedência e revise atualizações. Um arquivo de dependências não garante, sozinho, que tudo é confiável.",
        "Crie um inventário fictício de três dependências com origem, versão e responsável pela revisão.",
        "Antes de adicionar uma biblioteca, é importante:",
        "Verificar a origem, a manutenção e a necessidade.",
        "Escolher apenas pelo nome parecido com outra popular.",
        "Nomes semelhantes podem induzir a instalação da dependência errada.",
      ],
    ],
  ),
  course(
    "desenvolvimento",
    "Dados, injeção e desenho seguro",
    "AVANCADO",
    "Separe dados de comandos e analise o fluxo da aplicação.",
    owasp("A05_2025-Injection"),
    "OWASP Top 10:2025 — Injeção",
    [
      [
        "Dados não são comandos",
        "Concatenar entradas em comandos pode permitir interpretações inesperadas. Prefira interfaces parametrizadas e valide formato e limites. A validação complementa a separação entre dados e instruções.",
        "Descreva a diferença entre um parâmetro de consulta e um trecho concatenado em uma instrução.",
        "Qual medida ajuda a prevenir injeção em consultas?",
        "Usar consultas parametrizadas.",
        "Apenas trocar a cor do formulário.",
        "Parâmetros separam os valores da estrutura da consulta.",
      ],
      [
        "Saída adequada ao contexto",
        "O modo de apresentar um dado influencia seu risco. Texto deve ser renderizado como texto, não como HTML executável. Evite inserir conteúdo não confiável em mecanismos de execução.",
        "Explique por que uma mensagem de treinamento deve exibir tags como texto em vez de executá-las.",
        "Um cenário recebido como texto deve ser:",
        "Apresentado sem executar HTML ou scripts fornecidos.",
        "Executado para parecer mais realista.",
        "O isolamento impede que a simulação vire uma página ativa perigosa.",
      ],
      [
        "Fronteiras de confiança",
        "Desenhe os caminhos de dados e identifique onde passam entre componentes com permissões diferentes. Para cada fronteira, pergunte quem valida a entrada e quem decide o acesso.",
        "Faça um diagrama de navegador, API, banco e provedor externo. Marque quais dados cruzam cada ligação.",
        "Qual é a utilidade de modelar fronteiras de confiança?",
        "Localizar onde controles e validações são necessários.",
        "Eliminar a necessidade de revisar o código.",
        "O desenho orienta a análise, mas não substitui implementação e verificação.",
      ],
    ],
  ),
  course(
    "deteccao",
    "Detecção, risco e resposta",
    "AVANCADO",
    "Construa registros úteis e organize decisões de segurança.",
    "https://www.nist.gov/cyberframework",
    "NIST — Cybersecurity Framework",
    [
      [
        "Eventos que ajudam a investigar",
        "Logs úteis informam quando ocorreu uma ação, qual recurso foi afetado e o resultado. Evite dados secretos. Registros precisam de proteção e de um processo de análise para gerar valor.",
        "Desenhe um evento de tentativa de login fictício com horário, resultado e identificador, sem senha ou token.",
        "O que não deve entrar em um log de login?",
        "A senha digitada.",
        "O resultado da tentativa.",
        "Senhas nos registros criam uma nova exposição.",
      ],
      [
        "Priorizar por risco",
        "Uma lista de falhas precisa de contexto: ativos, exposição e impacto. Priorizar envolve decidir o que corrigir primeiro, registrar responsáveis e acompanhar o risco restante.",
        "Compare a indisponibilidade de um site de teste com a exposição de dados de clientes em um serviço público fictício.",
        "A prioridade de correção deve considerar:",
        "Exposição, impacto e contexto do ativo.",
        "Somente a ordem em que as falhas foram encontradas.",
        "A decisão precisa refletir o risco do ambiente.",
      ],
      [
        "Preparação e recuperação",
        "Organize responsáveis, comunicação e recuperação antes de um incidente. Um exercício de mesa testa decisões sem executar ataques. Registre o que funcionou e revise o plano depois.",
        "Simule em papel a perda de acesso a um serviço: quem decide, quem comunica e qual alternativa mantém o trabalho?",
        "Após um exercício de resposta, o próximo passo é:",
        "Registrar lições e ajustar os procedimentos.",
        "Arquivar o roteiro sem discutir o resultado.",
        "A revisão transforma o exercício em melhoria operacional.",
      ],
    ],
  ),
];

enrichFoundations(libraryCourses);
expandCourses(libraryCourses);
applyLearningLevels(libraryCourses);

// Referências específicas complementares às leituras de cada curso.
export const extraReferences = [
  { title: "CERT.br — Inteligência Artificial", url: cert("ia") },
  {
    title: "OWASP — Cadeia de software",
    url: owasp("A03_2025-Software_Supply_Chain_Failures"),
  },
  { title: "OWASP — Desenho inseguro", url: owasp("A06_2025-Insecure_Design") },
  {
    title: "OWASP — Registros e alertas",
    url: owasp("A09_2025-Security_Logging_and_Alerting_Failures"),
  },
];
export const findLibraryCourse = (id: string) =>
  libraryCourses.find((c) => c.id === id);
