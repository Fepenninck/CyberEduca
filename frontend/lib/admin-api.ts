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

export type AtualizacaoUsuario = Pick<AdminUsuario, 'nome' | 'email'>

export type TrilhaInput = {
  titulo: string
  descricao: string
  bloqueada?: boolean
  ordem: number
  nivel: 'BASICO' | 'INTERMEDIARIO' | 'AVANCADO'
}

export type TrilhaUpdate = Partial<TrilhaInput>

export type AdminTrilha = TrilhaInput & {
  id: string
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
export type StatusProvaAdmin = StatusPublicacao

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

export type AlternativaSimulacaoInput = {
  texto: string
  isCorreta: boolean
}

export type QuestaoSimulacaoInput = {
  enunciado: string
  contexto?: string
  explicacao?: string
  alternativas: AlternativaSimulacaoInput[]
}

export type SimulacaoInput = {
  nivel?: 'BASICO' | 'INTERMEDIARIO' | 'AVANCADO'
  duracaoMinutos?: number
  titulo: string
  descricao: string
  categoriaId: string
  questoes: QuestaoSimulacaoInput[]
}

export type SimulacaoAdmin = SimulacaoInput & {
  id: string
  criadoEm: string
  categoria?: CategoriaSimulacaoAdmin
}

export type CategoriaSimulacaoInput = { nome: string; descricao: string }
export type CategoriaSimulacaoAdmin = CategoriaSimulacaoInput & {
  id: string
  criadoEm: string
  simulacoes?: SimulacaoAdmin[]
}

export type ProvaInput = {
  titulo: string
  descricao: string
  trilhaId: string
  status: StatusPublicacao
  questoes?: QuestaoProvaInput[]
}

export type ProvaUpdate = Partial<ProvaInput>

export type QuestaoProvaInput = {
  enunciado: string
  tipo: 'MULTIPLA_ESCOLHA' | 'DISSERTATIVA'
  alternativas?: AlternativaProvaInput[]
}

export type AlternativaProvaInput = {
  texto: string
  isCorreta: boolean
}

export type AlternativaProvaAdmin = AlternativaProvaInput & {
  id: string
}

export type QuestaoProvaAdmin = Omit<QuestaoProvaInput, 'alternativas'> & {
  id: string
  alternativas?: AlternativaProvaAdmin[]
}

export type ProvaAdmin = Omit<ProvaInput, 'questoes' | 'status'> & {
  id: string
  status: StatusProvaAdmin
  trilha?: { id: string; titulo: string }
  questoes?: QuestaoProvaAdmin[]
}

export type ResultadoProvaAdmin = {
  id: string
  acertos: number
  totalQuestoes: number
  criadoEm: string
  usuario: { id: string; nome: string; email: string }
  prova: { id: string; titulo: string }
}

export type ResultadoSimulacaoAdmin = {
  id: string
  acertos: number
  totalQuestoes: number
  criadoEm: string
  usuario: { id: string; nome: string; email: string }
  simulacao: { id: string; titulo: string }
}

export type EstatisticaDificuldade = {
  provaId: string
  titulo: string
  mediaAcertos: number
  mediaNota: number
  totalResultados: number
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

export function listarResultadosProvas(): Promise<ResultadoProvaAdmin[]> {
  return requestJson('/admin/resultados/provas')
}

export function listarResultadosSimulacoes(): Promise<ResultadoSimulacaoAdmin[]> {
  return requestJson('/admin/resultados/simulacoes')
}

export function obterEstatisticasDificuldade(): Promise<EstatisticaDificuldade[]> {
  return requestJson('/admin/estatisticas/dificuldades')
}

export function listarUsuarios(): Promise<AdminUsuario[]> {
  return requestJson('/admin/usuarios')
}

export function buscarUsuario(id: string): Promise<AdminUsuario> {
  return requestJson(`/admin/usuarios/${encodeURIComponent(id)}`)
}

export function atualizarUsuario(id: string, dados: AtualizacaoUsuario): Promise<AdminUsuario> {
  return requestJson(`/admin/usuarios/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  })
}

export function excluirUsuario(id: string): Promise<void> {
  return requestJson(`/admin/usuarios/${encodeURIComponent(id)}`, { method: 'DELETE' })
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

export function excluirTrilha(id: string): Promise<void> {
  return requestJson(`/admin/trilhas/${encodeURIComponent(id)}`, { method: 'DELETE' })
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

export function excluirAula(id: string): Promise<void> {
  return requestJson(`/admin/aulas/${encodeURIComponent(id)}`, { method: 'DELETE' })
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

export function excluirQuiz(id: string): Promise<void> {
  return requestJson(`/admin/quizzes/${encodeURIComponent(id)}`, { method: 'DELETE' })
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

export function listarSimulacoes(): Promise<SimulacaoAdmin[]> {
  return requestJson('/admin/simulacoes')
}

export function listarCategoriasSimulacao(): Promise<CategoriaSimulacaoAdmin[]> {
  return requestJson('/admin/categorias-simulacao')
}

export function criarCategoriaSimulacao(dados: CategoriaSimulacaoInput): Promise<CategoriaSimulacaoAdmin> {
  return requestJson('/admin/categorias-simulacao', {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

export function excluirCategoriaSimulacao(id: string): Promise<void> {
  return requestJson(`/admin/categorias-simulacao/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function criarSimulacao(dados: SimulacaoInput): Promise<SimulacaoAdmin> {
  return requestJson('/admin/simulacoes', {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

export function editarSimulacao(id: string, dados: SimulacaoInput): Promise<SimulacaoAdmin> {
  return requestJson(`/admin/simulacoes/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  })
}

export function excluirSimulacao(id: string): Promise<void> {
  return requestJson(`/admin/simulacoes/${encodeURIComponent(id)}`, { method: 'DELETE' })
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

export function alterarStatusProva(id: string, status: StatusProvaAdmin): Promise<ProvaAdmin> {
  return requestJson(`/admin/provas/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function excluirProva(id: string): Promise<void> {
  return requestJson(`/admin/provas/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
