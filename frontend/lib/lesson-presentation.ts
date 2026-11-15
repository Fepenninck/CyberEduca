// Compatibilidade de apresentação com orientações do antigo questionário embutido.
// O conteúdo salvo da aula permanece intacto.
export function apresentarOrientacao(texto: string): string {
  return texto
    .replace(/; depois, escolha uma resposta na atividade desta página\. A correção aparece aqui no site\./g, '. Reflita sobre como essa relação se aplica ao exemplo apresentado.')
    .replace(/Você responde à atividade nesta página\./g, '')
    .replace(/Leia a situação e escolha uma resposta na atividade abaixo\. A explicação aparece aqui no site depois de responder\./g, 'Leia a situação e reflita sobre os cuidados apresentados no exemplo.')
    .replace(/Analise o exemplo desta página e responda à atividade abaixo\. A correção é feita aqui no site; /g, 'Analise o exemplo desta página e reflita sobre os cuidados apresentados. Para essa reflexão, ')
    .trim()
}
