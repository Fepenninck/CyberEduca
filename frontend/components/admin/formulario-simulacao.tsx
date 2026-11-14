'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { CategoriaSimulacaoAdmin, SimulacaoInput } from '@/lib/admin-api'

type FormularioSimulacaoProps = {
  categorias: CategoriaSimulacaoAdmin[]
  onSubmit: (dados: SimulacaoInput) => Promise<void>
  initialValues?: Partial<SimulacaoInput>
  submitLabel?: string
}

const campoClass = 'mt-2 w-full rounded-lg border border-[#35465c] bg-[#091321] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#b2ff00]'

function novaQuestao() {
  return {
    enunciado: '',
    contexto: '',
    explicacao: '',
    alternativas: [
      { texto: '', isCorreta: false },
      { texto: '', isCorreta: false },
    ],
  }
}

export function FormularioSimulacao({
  categorias,
  onSubmit,
  initialValues,
  submitLabel = 'Salvar simulação',
}: FormularioSimulacaoProps) {
  const [titulo, setTitulo] = useState(initialValues?.titulo ?? '')
  const [descricao, setDescricao] = useState(initialValues?.descricao ?? '')
  const [nivel, setNivel] = useState<NonNullable<SimulacaoInput['nivel']>>(initialValues?.nivel ?? 'BASICO')
  const [duracaoMinutos, setDuracaoMinutos] = useState(initialValues?.duracaoMinutos ?? 5)
  const [categoriaId, setCategoriaId] = useState(initialValues?.categoriaId ?? categorias[0]?.id ?? '')
  const [questoes, setQuestoes] = useState<SimulacaoInput['questoes']>(initialValues?.questoes ?? [])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro(null)

    if (questoes.length === 0) {
      setErro('Adicione pelo menos uma questão ao cenário.')
      return
    }
    if (!categoriaId) {
      setErro('Selecione uma categoria para a simulação.')
      return
    }
    const questaoInvalida = questoes.some((questao) =>
      questao.alternativas.length < 2 ||
      questao.alternativas.filter((alternativa) => alternativa.isCorreta).length !== 1,
    )
    if (questaoInvalida) {
      setErro('Cada questão precisa de pelo menos duas alternativas e uma resposta correta.')
      return
    }

    setSalvando(true)
    try {
      await onSubmit({
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        categoriaId,
        nivel,
        duracaoMinutos,
        questoes: questoes.map((questao) => ({
          enunciado: questao.enunciado.trim(),
          contexto: questao.contexto?.trim() ?? '',
          explicacao: questao.explicacao?.trim() ?? '',
          alternativas: questao.alternativas.map((alternativa) => ({
            texto: alternativa.texto.trim(),
            isCorreta: alternativa.isCorreta,
          })),
        })),
      })
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível salvar a simulação.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="rounded-2xl border border-[#34465d] bg-[#101b2a] p-5 sm:p-6">
      <div className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-200">Dificuldade<select className={campoClass} value={nivel} onChange={event => setNivel(event.target.value as typeof nivel)}><option value="BASICO">Básico</option><option value="INTERMEDIARIO">Intermediário</option><option value="AVANCADO">Avançado</option></select></label>
          <label className="text-sm font-medium text-slate-200">Duração estimada (minutos)<input className={campoClass} type="number" min={1} max={60} step={1} required value={duracaoMinutos} onChange={event => setDuracaoMinutos(Number(event.target.value))} /></label>
        </div>
        <label className="text-sm font-medium text-slate-200">
          Título
          <input className={campoClass} value={titulo} onChange={(event) => setTitulo(event.target.value)} required maxLength={160} />
        </label>
        <label className="text-sm font-medium text-slate-200">
          Descrição
          <textarea className={`${campoClass} min-h-24 resize-y`} value={descricao} onChange={(event) => setDescricao(event.target.value)} required maxLength={2000} />
        </label>
        <label className="text-sm font-medium text-slate-200">
          Categoria
          <select className={campoClass} value={categoriaId} onChange={(event) => setCategoriaId(event.target.value)} required>
            <option value="" disabled>Selecione uma categoria</option>
            {categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}
          </select>
        </label>
      </div>

      <section className="mt-7 border-t border-[#29394f] pt-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-white">Cenários e questões</h3>
            <p className="mt-1 text-xs text-slate-400">Treino prático sem nota. Marque a resposta correta para dar feedback ao aluno.</p>
          </div>
          <button type="button" onClick={() => setQuestoes((atuais) => [...atuais, novaQuestao()])} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[#50627b] px-3 py-2 text-xs font-semibold text-white transition hover:border-[#b2ff00]">
            <Plus size={15} /> Adicionar questão
          </button>
        </div>

        <div className="space-y-4">
          {questoes.map((questao, indice) => (
            <article key={indice} className="rounded-xl border border-[#29394f] bg-[#0b1522] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-200">Questão {indice + 1}</h4>
                <button type="button" aria-label={`Remover questão ${indice + 1}`} onClick={() => setQuestoes((atuais) => atuais.filter((_, i) => i !== indice))} className="text-slate-400 transition hover:text-rose-300">
                  <Trash2 size={16} />
                </button>
              </div>
              <label className="block text-sm font-medium text-slate-200">
                Contexto fictício da decisão (opcional)
                <textarea className={`${campoClass} min-h-24 resize-y font-mono`} value={questao.contexto ?? ''} onChange={event => setQuestoes(values => values.map((item, index) => index === indice ? { ...item, contexto: event.target.value } : item))} maxLength={10000} placeholder="Primeira linha: título da tela fictícia. Demais linhas: informações que o aluno deve analisar." />
              </label>
              <label className="mt-4 block text-sm font-medium text-slate-200">
                Enunciado
                <textarea className={`${campoClass} min-h-24 resize-y`} value={questao.enunciado} onChange={(event) => setQuestoes((atuais) => atuais.map((item, i) => i === indice ? { ...item, enunciado: event.target.value } : item))} required maxLength={3000} />
              </label>
              <label className="mt-4 block text-sm font-medium text-slate-200">Explicação exibida no resultado<textarea className={`${campoClass} min-h-24 resize-y`} value={questao.explicacao ?? ''} onChange={event => setQuestoes(values => values.map((item, index) => index === indice ? { ...item, explicacao: event.target.value } : item))} maxLength={4000} placeholder="Explique por que a ação recomendada é adequada a esta situação." /></label>

              <div className="mt-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Alternativas</p>
                {questao.alternativas.map((alternativa, alternativaIndice) => (
                  <div key={alternativaIndice} className="flex items-center gap-3">
                    <input className={`${campoClass} mt-0`} value={alternativa.texto} onChange={(event) => setQuestoes((atuais) => atuais.map((item, i) => i === indice ? { ...item, alternativas: item.alternativas.map((option, j) => j === alternativaIndice ? { ...option, texto: event.target.value } : option) } : item))} placeholder={`Alternativa ${alternativaIndice + 1}`} required maxLength={1000} />
                    <label className="flex shrink-0 items-center gap-2 text-xs text-slate-300">
                      <input type="checkbox" checked={alternativa.isCorreta} onChange={(event) => setQuestoes((atuais) => atuais.map((item, i) => i === indice ? { ...item, alternativas: item.alternativas.map((option, j) => ({ ...option, isCorreta: j === alternativaIndice ? event.target.checked : event.target.checked ? false : option.isCorreta })) } : item))} className="size-4 accent-[#b2ff00]" />
                      Correta
                    </label>
                    <button type="button" aria-label={`Remover alternativa ${alternativaIndice + 1}`} onClick={() => setQuestoes((atuais) => atuais.map((item, i) => i === indice ? { ...item, alternativas: item.alternativas.filter((_, j) => j !== alternativaIndice) } : item))} className="text-slate-500 transition hover:text-rose-300">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => setQuestoes((atuais) => atuais.map((item, i) => i === indice ? { ...item, alternativas: [...item.alternativas, { texto: '', isCorreta: false }] } : item))} className="text-xs font-semibold text-[#d5ff86] transition hover:text-white">
                  + Adicionar alternativa
                </button>
              </div>
            </article>
          ))}
          {questoes.length === 0 && <p className="rounded-lg border border-dashed border-[#35465c] p-5 text-center text-sm text-slate-500">Adicione questões para montar a simulação.</p>}
        </div>
      </section>

      {erro && <p role="alert" className="mt-4 text-sm text-rose-300">{erro}</p>}
      <div className="mt-6 flex justify-end">
        <button type="submit" disabled={salvando} className="rounded-lg bg-[#b2ff00] px-4 py-2.5 text-sm font-semibold text-[#132000] transition hover:bg-[#c7ff4b] disabled:cursor-wait disabled:opacity-60">
          {salvando ? 'Salvando…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
