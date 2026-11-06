import { libraryCourses, levelNames, type CourseLevel } from "./course-library";
import type { QuizDetalhe, ResultadoQuiz, RespostaQuiz } from "./quizzes-api";
import type { CenarioDetalhe } from "./phishing-api";

export const libraryQuizzes: QuizDetalhe[] = libraryCourses.map((course) => ({
  id: `local-${course.id}`,
  titulo: course.title,
  descricao: `Revise os conceitos de ${levelNames[course.level].toLowerCase()} com explicações para cada resposta.`,
  aulaId: course.id,
  aula: { id: course.id, titulo: course.title },
  questoes: course.lessons.map((l) => ({
    id: `${course.id}-${l.id}`,
    enunciado: l.question,
    ordem: Number(l.id.split("-")[1]),
    alternativas: l.options.map((texto, i) => ({
      id: `${course.id}-${l.id}-${i}`,
      texto,
      ordem: i + 1,
    })),
  })),
}));
export const assessments: QuizDetalhe[] = (
  ["BASICO", "INTERMEDIARIO", "AVANCADO"] as CourseLevel[]
).map((level) => ({
  id: `avaliacao-${level.toLowerCase()}`,
  titulo: `Autoavaliação — ${levelNames[level]}`,
  descricao:
    "Verifique seu domínio dos temas do nível. Resultado educativo calculado e salvo neste navegador, sem certificação.",
  aulaId: level,
  aula: { id: level, titulo: levelNames[level] },
  questoes: libraryQuizzes
    .filter(
      (q) => libraryCourses.find((c) => c.id === q.aulaId)?.level === level,
    )
    .flatMap((q) => q.questoes),
}));
export function findLocalQuiz(id: string) {
  return [...libraryQuizzes, ...assessments].find((q) => q.id === id);
}
export function correctLocalQuiz(
  quiz: QuizDetalhe,
  respostas: RespostaQuiz[],
): ResultadoQuiz {
  const feedback = quiz.questoes.map((q) => {
    const course = libraryCourses.find((c) =>
      c.lessons.some((l) => `${c.id}-${l.id}` === q.id),
    )!;
    const lesson = course.lessons.find((l) => `${course.id}-${l.id}` === q.id)!;
    const alternativaId =
      respostas.find((r) => r.questaoId === q.id)?.alternativaId || "";
    const alternativaCorretaId = q.alternativas[lesson.correct].id;
    return {
      questaoId: q.id,
      alternativaId,
      alternativaCorretaId,
      acertou: alternativaId === alternativaCorretaId,
      explicacao: lesson.explanation,
    };
  });
  return {
    tentativaId: `local-${Date.now()}`,
    quizId: quiz.id,
    totalQuestoes: quiz.questoes.length,
    totalAcertos: feedback.filter((f) => f.acertou).length,
    concluido: true,
    progressoAtualizado: false,
    feedback,
  };
}
type LocalScenario = CenarioDetalhe & {
  phishing: boolean;
  explanation: string;
  level: CourseLevel;
};
function scenario(
  id: string,
  titulo: string,
  tipo: CenarioDetalhe["tipo"],
  level: CourseLevel,
  conteudoMensagem: string,
  phishing: boolean,
  explanation: string,
): LocalScenario {
  return {
    id: `local-${id}`,
    titulo,
    tipo,
    level,
    descricao:
      "Leia o cenário e analise a origem, o contexto e o pedido antes de decidir.",
    conteudoMensagem,
    phishing,
    explanation,
    aulaId: "biblioteca-golpes",
    aula: {
      id: "biblioteca-golpes",
      titulo: `${levelNames[level]} · Identificação de phishing`,
    },
  };
}
export const localScenarios: LocalScenario[] = [
  scenario(
    "email-bloqueio",
    "Sua conta será bloqueada",
    "EMAIL",
    "BASICO",
    "De: Equipe de acesso <suporte@conta-verificar.invalid>\nAssunto: Bloqueio em 10 minutos\n\nSua conta será suspensa. Envie sua senha e o código de verificação para evitar o bloqueio. Não contate o suporte habitual.",
    true,
    "O cenário combina urgência, pedido de senha e código, além de desencorajar a confirmação independente. Não responda com credenciais.",
  ),
  scenario(
    "sms-entrega",
    "Uma entrega pendente",
    "SMS",
    "BASICO",
    "Entrega retida! Pague agora a taxa no endereço entrega-pendente.invalid para liberar seu pacote. Prazo: 15 minutos.",
    true,
    "A pressão e a cobrança inesperada pedem verificação. Consulte a entrega pelo aplicativo ou site oficial, sem usar o endereço recebido.",
  ),
  scenario(
    "email-agenda",
    "Aviso de reunião",
    "EMAIL",
    "BASICO",
    "Cenário: você acabou de combinar uma reunião no sistema interno.\n\nDe: agenda@empresa.example\nSua reunião está confirmada para amanhã às 10h. Os detalhes já estão disponíveis no calendário interno. Nenhuma ação é necessária.",
    false,
    "No contexto fictício apresentado, o aviso corresponde a uma ação esperada e não solicita credenciais, pagamento ou acesso por endereço externo. A classificação vale para este cenário, não para todo e-mail de reunião.",
  ),
  scenario(
    "social-premio",
    "Você ganhou um prêmio",
    "REDE_SOCIAL",
    "BASICO",
    "Perfil: Promoções Oficiais 2026\nParabéns! Você foi selecionado sem inscrição. Para receber o prêmio, envie foto do documento e pague a taxa de liberação por mensagem privada.",
    true,
    "Prêmio inesperado com cobrança e pedido de documento é um forte sinal de fraude. Um nome de perfil com a palavra oficial não comprova identidade.",
  ),
  scenario(
    "site-login",
    "Página de acesso alternativa",
    "SITE",
    "INTERMEDIARIO",
    "Endereço apresentado: login.empresa.example.validacao.invalid\n\nPortal corporativo\nDigite sua senha e o código do autenticador. Se o navegador alertar sobre segurança, ignore e continue.",
    true,
    "O endereço termina em validacao.invalid; empresa.example aparece apenas no início. A instrução para ignorar avisos e fornecer o código reforça a suspeita.",
  ),
  scenario(
    "sms-codigo",
    "Compartilhe o código",
    "SMS",
    "INTERMEDIARIO",
    "Olá, sou do suporte. Um código vai chegar no seu celular. Envie para mim para cancelar um acesso indevido. Não abra o aplicativo enquanto resolvo.",
    true,
    "Códigos de verificação autorizam ações. Pedir o código sob o pretexto de cancelar um acesso é engenharia social. Procure o suporte pelo canal oficial.",
  ),
  scenario(
    "email-recibo",
    "Recibo de compra esperada",
    "EMAIL",
    "INTERMEDIARIO",
    "Contexto: você concluiu uma compra no aplicativo oficial há um minuto.\nDe: recibos@loja.example\nPedido 123 confirmado. O recibo está na área de pedidos do aplicativo. Esta mensagem não solicita pagamento adicional nem contém anexos.",
    false,
    "A mensagem está alinhada ao contexto fornecido e orienta a consulta no aplicativo já utilizado. A ausência de links não garante legitimidade em qualquer situação, mas aqui não há tentativa de captura.",
  ),
  scenario(
    "social-amigo",
    "Um amigo em outro número",
    "REDE_SOCIAL",
    "INTERMEDIARIO",
    "Sou eu, troquei de número e não consigo falar agora. Preciso de uma transferência urgente para outra pessoa. Não ligue, estou em reunião.",
    true,
    "A troca de contato, a urgência e a recusa em confirmar por voz são sinais de fraude por personificação. Confirme com o contato antigo ou outro canal conhecido.",
  ),
  scenario(
    "email-fornecedor",
    "Mudança de conta do fornecedor",
    "EMAIL",
    "AVANCADO",
    "De: financeiro@fornecedor-pagamentos.invalid\nAssunto: Nova conta para o contrato em andamento\nConhecemos o número do seu pedido. Atualize os dados bancários hoje e mantenha esta mudança fora do fluxo habitual de aprovação.",
    true,
    "Dados de um contrato não comprovam a identidade do remetente. A tentativa de contornar aprovação e mudar a conta exige confirmação independente com o fornecedor.",
  ),
  scenario(
    "site-consentimento",
    "Permissões além da necessidade",
    "SITE",
    "AVANCADO",
    "Convite para visualizar um documento\n\nO aplicativo Leitor Express solicita: ler todos os seus e-mails, enviar mensagens em seu nome e manter acesso permanente. Confirme para visualizar uma única página.",
    true,
    "O pedido usa a visualização de um documento como pretexto para obter permissões muito mais amplas. Avalie o consentimento e confirme a procedência do aplicativo.",
  ),
  scenario(
    "email-suporte",
    "Resposta a chamado conhecido",
    "EMAIL",
    "AVANCADO",
    "Contexto: você abriu o chamado 456 no portal oficial e retornou ao mesmo portal digitando o endereço conhecido.\n\nO atendimento informa que a manutenção foi concluída. Não solicita senha, código, instalação ou acesso remoto.",
    false,
    "O contexto define uma consulta feita no canal oficial e ligada a um chamado iniciado por você. Nenhum pedido de captura aparece neste cenário.",
  ),
  scenario(
    "social-recrutador",
    "Entrevista com instalação obrigatória",
    "REDE_SOCIAL",
    "AVANCADO",
    "Recrutador: para a entrevista, baixe nosso avaliador por mensagem. Desative a proteção do computador para ele funcionar. Não temos site nem processo de confirmação.",
    true,
    "Pedir instalação por mensagem e desativação de proteção é um forte sinal de risco. Verifique a empresa e o processo por canais independentes.",
  ),
];
