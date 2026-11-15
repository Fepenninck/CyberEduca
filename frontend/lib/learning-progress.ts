type Nivel = { totalAulas: number; aulasConcluidas: number; conquistada: boolean; desbloqueado: boolean }

// Duas etapas de mesmo peso: estudar as aulas e obter aprovação na prova.
export function progressoDoNivel(nivel: Nivel): number {
  if (nivel.conquistada) return 100
  if (!nivel.desbloqueado || nivel.totalAulas <= 0) return 0
  return Math.floor(Math.min(1, nivel.aulasConcluidas / nivel.totalAulas) * 50)
}

export function progressoDoPercurso(niveis: Nivel[]): number {
  return niveis.length ? Math.floor(niveis.reduce((total, nivel) => total + progressoDoNivel(nivel), 0) / niveis.length) : 0
}
