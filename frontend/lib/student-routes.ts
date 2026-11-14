export function isStudentPath(pathname: string) {
  return /^\/(dashboard|aulas|trilhas|simulacoes|quizzes|avaliacoes|verificador|perfil|configuracoes)(\/|$)/.test(pathname)
}
