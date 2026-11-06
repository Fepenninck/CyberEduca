export type LessonVideo = {
  title: string;
  url: string;
  source: string;
  prompt: string;
};
export const courseReadings: Record<
  string,
  { title: string; url: string; task: string }[]
> = {
  "biblioteca-contas": [
    {
      title: "NIST — Autenticação e autenticadores",
      url: "https://pages.nist.gov/800-63-4/sp800-63b.html",
      task: "Compare os conceitos de autenticador, sessão e resistência a phishing. Identifique quais deles aparecem no caso da aula.",
    },
    {
      title: "OWASP — Gestão de sessões",
      url: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html",
      task: "Localize expiração e invalidação de sessão. Explique a diferença entre fechar uma aba e encerrar o acesso no serviço.",
    },
  ],
  "biblioteca-acesso": [
    {
      title: "OWASP — Autorização",
      url: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html",
      task: "Procure privilégio mínimo e negação por padrão. Transforme uma recomendação em um teste para o sistema fictício da atividade.",
    },
  ],
  "biblioteca-configuracao": [
    {
      title: "OWASP — Gestão de segredos",
      url: "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html",
      task: "Identifique armazenamento, rotação e revogação. Registre o responsável e a evidência esperada para cada etapa.",
    },
    {
      title: "OWASP — Cadeia de software",
      url: "https://top10.owasp.org/2025/A03_2025-Software_Supply_Chain_Failures/",
      task: "Relacione origem, construção e distribuição do artefato ao inventário do seu exercício.",
    },
  ],
  "biblioteca-desenvolvimento": [
    {
      title: "OWASP — Prevenção de injeção SQL",
      url: "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html",
      task: "Encontre a separação entre consulta e parâmetros e explique por que autorização ainda é necessária.",
    },
    {
      title: "OWASP — Prevenção de XSS",
      url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html",
      task: "Compare saída em HTML, atributo e URL. Registre por que o contexto muda o tratamento.",
    },
    {
      title: "OWASP — Modelagem de ameaças",
      url: "https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html",
      task: "Use o desenho do exercício para identificar fronteiras e escrever uma ameaça com controle verificável.",
    },
  ],
  "biblioteca-deteccao": [
    {
      title: "OWASP — Registros de segurança",
      url: "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html",
      task: "Compare o esquema de evento da sua atividade com os dados necessários à investigação e os dados que não devem ser registrados.",
    },
    {
      title: "NIST SP 800-61r3 — Resposta a incidentes",
      url: "https://csrc.nist.gov/pubs/sp/800/61/r3/final",
      task: "Relacione preparação, detecção, resposta e recuperação ao projeto fictício. Registre pelo menos uma dependência entre as decisões.",
    },
  ],
  "biblioteca-remoto-ia": [
    {
      title: "CERT.br — Inteligência Artificial",
      url: "https://cartilha.cert.br/fasciculos/ia/fasciculo-ia.pdf",
      task: "Identifique cuidados com dados, revisão das respostas e limites das ações de assistentes. Aplique-os ao relatório fictício da aula.",
    },
  ],
};
const nic = "https://cidadaonarede.nic.br";
export const lessonVideos: Record<string, LessonVideo> = {
  "biblioteca-contas/aula-1": {
    title: "Senhas seguras — NIC.br / Cidadão na Rede",
    url: `${nic}/download/files/downloads/2/2-Senhas-1080p_site.mp4`,
    source: `${nic}/pt/videos/senhas-seguras`,
    prompt:
      "Depois de assistir, explique por que uma senha baseada em dados públicos é previsível e por que exclusividade importa além do tamanho.",
  },
  "biblioteca-contas/aula-2": {
    title: "Verificação em dois fatores — NIC.br / Cidadão na Rede",
    url: `${nic}/download/files/downloads/6/6-DoisFatores-1080p_site.mp4`,
    source: `${nic}/pt/videos/verificacao-em-dois-fatores`,
    prompt:
      "Identifique duas categorias de fatores e explique por que não se deve aprovar uma solicitação de login desconhecida.",
  },
  "biblioteca-golpes/aula-1": {
    title: "O que é engenharia social? — NIC.br / Cidadão na Rede",
    url: `${nic}/download/files/downloads/126/120engenhariasocial-1080p_site.mp4`,
    source: `${nic}/pt/videos/o-que-e-engenharia-social`,
    prompt:
      "Liste a emoção explorada, a ação solicitada e um caminho de confirmação independente para o exemplo da aula.",
  },
  "biblioteca-dispositivos/aula-1": {
    title: "Mantenha os programas atualizados — NIC.br / Cidadão na Rede",
    url: `${nic}/download/files/downloads/15/14-DispositivoAtualizado-1080p_site.mp4`,
    source: `${nic}/pt/videos/mantenha-os-programas-atualizados`,
    prompt:
      "Diferencie atualização de aplicativo, sistema e firmware. Descreva como conferir o estado de cada camada.",
  },
  "biblioteca-dispositivos/aula-2": {
    title: "Permissões de aplicativos — NIC.br / Cidadão na Rede",
    url: `${nic}/download/files/downloads/71/65-Celulares-PermissoesApps-1080p_site.mp4`,
    source: `${nic}/pt/videos/permissoes-de-aplicativos`,
    prompt:
      "Escolha uma permissão e explique quando ela é necessária, quando é excessiva e como revisar a decisão.",
  },
  "biblioteca-backup/aula-1": {
    title: "Backup — NIC.br / Cidadão na Rede",
    url: `${nic}/download/files/downloads/25/23-Backup-1080p_site.mp4`,
    source: `${nic}/pt/videos/seguranca/backup`,
    prompt:
      "Descreva uma perda possível e qual cópia permitiria recuperar os dados. Explique por que a restauração deve ser testada.",
  },
};
export const courseDiagrams: Record<
  string,
  {
    title: string;
    nodes: [string, string, string];
    notes: [string, string, string];
    caption: string;
  }
> = {
  "biblioteca-contas": {
    title: "Identidade em camadas",
    nodes: ["Credencial", "Autenticação", "Sessão"],
    notes: [
      "Proteger e não reutilizar",
      "Validar o fator e a origem",
      "Revisar e revogar acessos",
    ],
    caption:
      "Proteger uma conta envolve o segredo, o processo de entrada e o acesso que permanece depois do login.",
  },
  "biblioteca-golpes": {
    title: "Uma pausa antes da decisão",
    nodes: ["Pedido recebido", "Verificação", "Ação consciente"],
    notes: [
      "Quem pede e o que quer?",
      "Confirmar em outro canal",
      "Agir ou reportar a suspeita",
    ],
    caption:
      "Reconhecer um sinal não encerra a análise: confirme a origem e a finalidade antes de executar o pedido.",
  },
  "biblioteca-dispositivos": {
    title: "Proteção do dispositivo",
    nodes: ["Sistema", "Aplicativos", "Dados e contas"],
    notes: [
      "Suporte e atualizações",
      "Origem e permissões",
      "Bloqueio e recuperação",
    ],
    caption:
      "As camadas se complementam. Uma proteção não substitui automaticamente as demais.",
  },
  "biblioteca-backup": {
    title: "Cópia só vale se recuperar",
    nodes: ["Dados originais", "Cópia protegida", "Restauração"],
    notes: [
      "Escolher o que importa",
      "Separar falhas e acessos",
      "Comparar versão e conteúdo",
    ],
    caption:
      "O teste deve recuperar dados em um destino alternativo, sem colocar o original em risco.",
  },
  "biblioteca-redes": {
    title: "Separar etapas da conexão",
    nodes: ["Nome e resolução", "Transporte", "Aplicação"],
    notes: [
      "DNS encontra o destino",
      "Conexão e identidade TLS",
      "Permissões e conteúdo",
    ],
    caption:
      "Resolver um nome, proteger a conexão e confiar na aplicação são decisões diferentes.",
  },
  "biblioteca-privacidade": {
    title: "Ciclo de exposição dos dados",
    nodes: ["Coletar", "Usar e compartilhar", "Reter e descartar"],
    notes: [
      "Finalidade e necessidade",
      "Público e permissões",
      "Prazo, versões e cópias",
    ],
    caption:
      "Defina cuidados em todo o ciclo; o risco não termina quando o arquivo deixa a tela.",
  },
  "biblioteca-malware": {
    title: "Da observação à resposta",
    nodes: ["Sinal observado", "Triagem", "Resposta coordenada"],
    notes: [
      "Registrar fato e horário",
      "Verificar alcance e contexto",
      "Conter e recuperar com plano",
    ],
    caption:
      "Sintoma não é conclusão. O processo transforma sinais em decisões apoiadas em evidência.",
  },
  "biblioteca-remoto-ia": {
    title: "Fronteiras no trabalho remoto",
    nodes: ["Pessoa e equipamento", "Canal aprovado", "Informação e ação"],
    notes: [
      "Identidade e ambiente",
      "Ferramentas autorizadas",
      "Minimização e revisão",
    ],
    caption:
      "Uma ferramenta aprovada não recebe automaticamente autorização para toda informação ou ação.",
  },
  "biblioteca-acesso": {
    title: "Uma decisão por operação",
    nodes: ["Identidade", "Regra de acesso", "Recurso e efeito"],
    notes: [
      "Quem solicita?",
      "Pode realizar esta ação?",
      "Sobre qual objeto e escopo?",
    ],
    caption:
      "Autenticar não é autorizar. A regra deve impedir o efeito da operação quando a permissão não existe.",
  },
  "biblioteca-configuracao": {
    title: "Rastreabilidade da entrega",
    nodes: ["Origem", "Construção", "Artefato entregue"],
    notes: [
      "Código e dependências",
      "Configuração e verificações",
      "Versão, evidência e retorno",
    ],
    caption:
      "A evidência de teste precisa corresponder ao artefato realmente implantado.",
  },
  "biblioteca-desenvolvimento": {
    title: "Separar dados e decisões",
    nodes: ["Entrada", "Processamento", "Saída"],
    notes: [
      "Tipo, formato e limite",
      "Autorização e invariantes",
      "Contexto e dados permitidos",
    ],
    caption:
      "Validação, autorização e renderização segura cumprem papéis distintos ao longo do fluxo.",
  },
  "biblioteca-deteccao": {
    title: "Evidência orienta a resposta",
    nodes: ["Evento", "Análise", "Decisão e revisão"],
    notes: [
      "Contexto e correlação",
      "Hipóteses e lacunas",
      "Conter, recuperar e aprender",
    ],
    caption:
      "Um evento isolado raramente comprova toda a narrativa; registre também o que ainda não se sabe.",
  },
};
