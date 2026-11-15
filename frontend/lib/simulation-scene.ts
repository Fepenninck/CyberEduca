export const modelosCenario = { EMAIL: 'E-mail', MENSAGEM: 'Mensagem / SMS', SITE: 'Site / página de acesso' } as const;
export type ModeloCenario = keyof typeof modelosCenario;
export type CenarioSimulacao = {
  formato: 'cybereduca-simulation-scene-v1'; modelo: ModeloCenario;
  titulo: string; remetente: string; destinatario: string; assunto: string;
  conteudo: string; endereco: string; anexo: string; contextoAnterior: string;
};
export function criarCenario(modelo: ModeloCenario, anterior = ''): CenarioSimulacao {
  return { formato: 'cybereduca-simulation-scene-v1', modelo,
    titulo: 'Analise a situação e escolha como agir',
    remetente: modelo === 'EMAIL' ? 'Atendimento <atendimento@exemplo.invalid>' : 'Atendimento',
    destinatario: 'Você', assunto: 'Atualização da sua conta',
    conteudo: modelo === 'SITE' ? 'Entre na sua conta para conferir a atualização solicitada.' : 'Recebemos uma solicitação de atualização da sua conta. Acesse o endereço abaixo para conferir os detalhes.',
    endereco: 'https://conta.exemplo.invalid', anexo: '', contextoAnterior: anterior };
}
export function lerCenario(valor?: string): CenarioSimulacao | null {
  if (!valor || valor.length > 10000 || !valor.trim().startsWith('{')) return null;
  try {
    const item = JSON.parse(valor);
    if (!item || item.formato !== 'cybereduca-simulation-scene-v1' || !Object.hasOwn(modelosCenario, item.modelo)) return null;
    for (const campo of ['titulo','remetente','destinatario','assunto','conteudo','endereco','anexo','contextoAnterior']) if (typeof item[campo] !== 'string') return null;
    return item as CenarioSimulacao;
  } catch { return null; }
}
export function salvarCenario(cenario: CenarioSimulacao): string { return JSON.stringify(cenario); }
export function criarQuestaoCenario(modelo: ModeloCenario) {
  return {
    enunciado: 'Ao encontrar esta situação, qual ação você deve realizar?',
    contexto: salvarCenario(criarCenario(modelo)),
    explicacao: 'Confirme a solicitação por um canal oficial antes de abrir links, anexos ou informar dados pessoais.',
    alternativas: [
      { texto: 'Confirmar a solicitação por um canal oficial', isCorreta: true },
      { texto: modelo === 'SITE' ? 'Informar meus dados nesta página' : 'Abrir o link e informar meus dados', isCorreta: false },
      { texto: 'Compartilhar o endereço com outras pessoas sem verificar', isCorreta: false },
    ],
  };
}
