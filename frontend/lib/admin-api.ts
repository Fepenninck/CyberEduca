import { apiFetch } from '@/lib/api'

export type ResumoDashboard = {
  totalUsuarios: number
  totalTrilhas: number
  totalAulas: number
}

export type AdminUsuario = {
  id: string
  nome: string
  email: string
  foto: string | null
  papel: string
  criadoEm: string
  atualizadoEm: string
}

export type TrilhaInput = {
  titulo: string
  descricao: string
  bloqueada?: boolean
  ordem: number
}

export type TrilhaUpdate = Partial<TrilhaInput>

export type AdminTrilha = TrilhaInput & {
  id: string
  nivel: 'BASICO' | 'INTERMEDIARIO' | 'AVANCADO'
  totalAulas: number
}

export type AulaInput = {
  titulo: string
  conteudo: string
  ordem: number
  trilhaId: string
}

export type AulaUpdate = Partial<AulaInput>

export type AdminAula = AulaInput & {
  id: string
  trilha: { id: string; titulo: string }
}

export type QuizAdminInput = {
  titulo: string
  descricao: string
  aulaId: string
}

export type StatusPublicacao = 'RASCUNHO' | 'PUBLICADO' | 'ARQUIVADO'

export type QuizAdmin = QuizAdminInput & {
  id: string
  status: StatusPublicacao
}

export type CenarioPhishingInput = {
  titulo: string
  conteudoEmail: string
  remetenteFalso: string
  dificuldade: string
}

export type CenarioPhishingAdmin = CenarioPhishingInput & {
  id: string
}

export type ProvaInput = {
  titulo: string
  descricao: string
  trilhaId: string
  status: StatusPublicacao
}

export type ProvaUpdate = Partial<ProvaInput>

export type QuestaoProvaInput = {
  enunciado: string
}

export type AlternativaProvaInput = {
  texto: string
  isCorreta: boolean
}

export type AlternativaProvaAdmin = AlternativaProvaInput & {
  id: string
}

export type QuestaoProvaAdmin = QuestaoProvaInput & {
  id: string
  alternativas?: AlternativaProvaAdmin[]
}

export type ProvaAdmin = ProvaInput & {
  id: string
  trilha?: { id: string; titulo: string }
  questoes?: QuestaoProvaAdmin[]
}

async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers)
  if (options?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await apiFetch(path, { ...options, headers })
  const resultado = await response.json().catch(() => null) as
    | (T & { message?: string | string[] })
    | null

  if (!response.ok) {
    const mensagem = resultado?.message
    throw new Error(
      Array.isArray(mensagem)
        ? mensagem.join(' ')
        : mensagem || 'Não foi possível concluir a solicitação administrativa.',
    )
  }

  return resultado as T
}

export function buscarResumoDashboard(): Promise<ResumoDashboard> {
  return requestJson('/admin/dashboard')
}

export function listarUsuarios(): Promise<AdminUsuario[]> {
  return requestJson('/admin/usuarios')
}

export function buscarUsuario(id: string): Promise<AdminUsuario> {
  return requestJson(`/admin/usuarios/${encodeURIComponent(id)}`)
}

export function listarTrilhas(): Promise<AdminTrilha[]> {
  return requestJson('/admin/trilhas')
}

export function listarAulas(): Promise<AdminAula[]> {
  return requestJson('/admin/aulas')
}

export function criarTrilha(dados: TrilhaInput) {
  return requestJson('/admin/trilhas', {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

export function editarTrilha(id: string, dados: TrilhaUpdate) {
  return requestJson(`/admin/trilhas/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  })
}

export function criarAula(dados: AulaInput) {
  return requestJson('/admin/aulas', {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

export function editarAula(id: string, dados: AulaUpdate) {
  return requestJson(`/admin/aulas/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  })
}

export function listarQuizzesAdmin(): Promise<QuizAdmin[]> {
  return requestJson('/admin/quizzes')
}

export function criarQuizAdmin(dados: QuizAdminInput): Promise<QuizAdmin> {
  return requestJson('/admin/quizzes', {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

export function alterarStatusQuiz(id: string, status: StatusPublicacao): Promise<QuizAdmin> {
  return requestJson(`/admin/quizzes/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function listarCenariosAdmin(): Promise<CenarioPhishingAdmin[]> {
  return requestJson('/admin/phishing/cenarios')
}

export function criarCenarioAdmin(dados: CenarioPhishingInput): Promise<CenarioPhishingAdmin> {
  return requestJson('/admin/phishing/cenarios', {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

export function listarProvasAdmin(): Promise<ProvaAdmin[]> {
  return requestJson('/admin/provas')
}

export function criarProvaAdmin(dados: ProvaInput): Promise<ProvaAdmin> {
  return requestJson('/admin/provas', {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

export function atualizarProvaAdmin(id: string, dados: ProvaUpdate): Promise<ProvaAdmin> {
  return requestJson(`/admin/provas/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  })
}

export function adicionarQuestaoProva(
  provaId: string,
  dados: QuestaoProvaInput,
): Promise<QuestaoProvaAdmin> {
  return requestJson(`/admin/provas/${encodeURIComponent(provaId)}/questoes`, {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

export function adicionarAlternativaProva(
  provaId: string,
  questaoId: string,
  dados: AlternativaProvaInput,
): Promise<AlternativaProvaAdmin> {
  return requestJson(
    `/admin/provas/${encodeURIComponent(provaId)}/questoes/${encodeURIComponent(questaoId)}/alternativas`,
    {
      method: 'POST',
      body: JSON.stringify(dados),
    },
  )
}

export function alterarStatusProva(id: string, status: StatusPublicacao): Promise<ProvaAdmin> {
  return requestJson(`/admin/provas/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}
