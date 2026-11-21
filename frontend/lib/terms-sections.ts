export type TermsSection = { id: string; titulo: string; conteudo: string }

const originalAnchors: Record<string, string> = {
  'aceitacao-dos-termos': 'aceitacao',
  'finalidade-da-plataforma': 'finalidade',
  'cadastro-e-conta': 'conta',
  'uso-aceitavel': 'uso-aceitavel',
  'simulacoes-de-phishing': 'simulacoes',
  'conteudo-e-propriedade-intelectual': 'conteudo',
  'disponibilidade-e-alteracoes': 'disponibilidade',
  'encerramento-da-conta': 'suspensao',
  'responsabilidades': 'responsabilidade',
  'lei-aplicavel-e-solucao-de-conflitos': 'lei-foro',
  'alteracoes-destes-termos': 'alteracoes-termos',
}

export function parseTermsSections(content: string): TermsSection[] {
  const sections: { titulo: string; lines: string[] }[] = []
  let current: typeof sections[number] | null = null
  let fence = ''
  for (const line of content.replace(/\r\n/g, '\n').split('\n')) {
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/)
    if (marker) {
      if (!fence) fence = marker[1][0]
      else if (fence === marker[1][0]) fence = ''
    }
    const heading = !fence && !marker ? line.match(/^\s{0,3}##\s+(.+?)(?:\s+#+)?\s*$/) : null
    if (heading) {
      current = { titulo: heading[1].trim(), lines: [] }
      sections.push(current)
    } else if (current) current.lines.push(line)
    else if (line.trim()) {
      current = { titulo: 'Termos de Uso', lines: [line] }
      sections.push(current)
    }
  }
  const counts = new Map<string, number>()
  return sections.map(section => {
    const slug = section.titulo.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'secao'
    const anchor = originalAnchors[slug] || `termos-${slug}`
    const count = (counts.get(anchor) || 0) + 1
    counts.set(anchor, count)
    return { id: count === 1 ? anchor : `${anchor}-${count}`, titulo: section.titulo, conteudo: section.lines.join('\n').trim() }
  })
}

export function serializeTermsSections(sections: Pick<TermsSection, 'titulo' | 'conteudo'>[]): string {
  return sections.map(section => {
    let fence = ''
    const body = section.conteudo.trim().split('\n').map(line => {
      const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/)
      if (marker) {
        if (!fence) fence = marker[1][0]
        else if (fence === marker[1][0]) fence = ''
      }
      // A heading inside a section belongs to that card, rather than creating another card.
      return !fence && !marker ? line.replace(/^(\s{0,3})#{1,2}(\s+)/, '$1###$2') : line
    }).join('\n')
    return `## ${section.titulo.trim()}\n\n${body}`
  }).join('\n\n')
}
