export function courseButtonLabel(percent: number, started: boolean): string {
  return percent >= 100 ? 'Concluída' : percent > 0 || started ? 'Continuar trilha' : 'Ver trilha'
}
