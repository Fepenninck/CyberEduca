'use client'

import { useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { AdminTrilha, ProvaInput, QuestaoProvaInput, StatusPublicacao } from '@/lib/admin-api'

type FormularioProvaProps = {
  trilhas: AdminTrilha[]
  onSubmit: (dados: ProvaInput) => Promise<void>
  initialValues?: Partial<ProvaInput>
  submitLabel?: string
  permitirQuestoes?: boolean
}

const statusOptions: Array<{ value: StatusPublicacao; label: string }> = [
  { value: 'RASCUNHO', label: 'Rascunho' },
  { value: 'PUBLICADO', label: 'Publicado' },
  { value: 'ARQUIVADO', label: 'Arquivado' },
]

const campoClass = 'mt-2 w-full rounded-lg border border-[#35465c] bg-[#091321] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#b2ff00]'

export function FormularioProva({
  trilhas,
  onSubmit,
  initialValues,
  submitLabel = 'Salvar prova',
  permitirQuestoes = true,
}: FormularioProvaProps) {
  const [titulo, setTitulo] = useState(initialValues?.titulo ?? '')
  const [descricao, setDescricao] = useState(initialValues?.descricao ?? '')
  const [trilhaId, setTrilhaId] = useState(initialValues?.trilhaId ?? trilhas[0]?.id ?? '')
  const [status, setStatus] = useState<StatusPublicacao>(initialValues?.status ?? 'RASCUNHO')
  const [questoes, setQuestoes] = useState<QuestaoProvaInput[]>(initialValues?.questoes ?? [])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSalvando(true)
    setErro(null)

    try {
      if (permitirQuestoes) {
        const quizInvalido = questoes.some((questao) => questao.tipo === 'MULTIPLA_ESCOLHA'
          && ((questao.alternativas?.length ?? 0) < 2
            || questao.alternativas?.filter((alternativa) => alternativa.isCorreta).length !== 1))
        if (quizInvalido) {
          throw new Error('Cada questão de múltipla escolha precisa de ao menos duas alternativas e uma correta.')
        }
      }

      await onSubmit({
        titulo: titulo.trim(), descricao: descricao.trim(), trilhaId, status,
        ...(permitirQuestoes ? { questoes } : {}),
      })
    } catch (erroEnvio) {
      setErro(erroEnvio instanceof Error ? erroEnvio.message : 'Não foi possível salvar a prova.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="rounded-2xl border border-[#34465d] bg-[#101b2a] p-5 sm:p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-200 sm:col-span-2">
          Título
          <input className={campoClass} value={titulo} onChange={(event) => setTitulo(event.target.value)} required maxLength={160} />
        </label>
        <label className="text-sm font-medium text-slate-200 sm:col-span-2">
          Descrição
          <textarea className={`${campoClass} min-h-28 resize-y`} value={descricao} onChange={(event) => setDescricao(event.target.value)} required maxLength={2000} />
        </label>
        <label className="text-sm font-medium text-slate-200">
          Trilha
          <select className={campoClass} value={trilhaId} onChange={(event) => setTrilhaId(event.target.value)} required disabled={trilhas.length === 0}>
            <option value="" disabled>Selecione uma trilha</option>
            {trilhas.map((trilha) => <option key={trilha.id} value={trilha.id}>{trilha.titulo}</option>)}
          </select>
          {trilhas.length === 0 && <span className="mt-2 block text-xs text-amber-300">Cadastre uma trilha antes de criar provas.</span>}
        </label>
        <label className="text-sm font-medium text-slate-200">
          Status
          <select className={campoClass} value={status} onChange={(event) => setStatus(event.target.value as StatusPublicacao)}>
            {statusOptions.map((opcao) => <option key={opcao.value} value={opcao.value}>{opcao.label}</option>)}
          </select>
        </label>
      </div>

      {permitirQuestoes && (
        <section className="mt-7 border-t border-[#29394f] pt-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-white">Questões</h3>
              <p className="mt-1 text-xs text-slate-400">Monte questões de múltipla escolha ou dissertativas nesta etapa.</p>
            </div>
            <button type="button" onClick={() => setQuestoes((atual) => [...atual, { enunciado: '', tipo: 'MULTIPLA_ESCOLHA', alternativas: [{ texto: '', isCorreta: false }, { texto: '', isCorreta: false }] }])} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[#50627b] px-3 py-2 text-xs font-semibold text-white hover:border-[#b2ff00]">
              <Plus size={15} /> Adicionar questão
            </button>
          </div>
          <div className="space-y-4">
            {questoes.map((questao, indice) => (
              <article key={indice} className="rounded-xl border border-[#29394f] bg-[#0b1522] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-200">Questão {indice + 1}</span>
                  <button type="button" aria-label={`Remover questão ${indice + 1}`} onClick={() => setQuestoes((atual) => atual.filter((_, i) => i !== indice))} className="text-slate-400 hover:text-rose-300"><Trash2 size={16} /></button>
                </div>
                <label className="block text-sm font-medium text-slate-200">
                  Enunciado
                  <textarea className={`${campoClass} min-h-24 resize-y`} value={questao.enunciado} required onChange={(event) => setQuestoes((atual) => atual.map((item, i) => i === indice ? { ...item, enunciado: event.target.value } : item))} />
                </label>
                <label className="mt-4 block text-sm font-medium text-slate-200">
                  Tipo
                  <select className={campoClass} value={questao.tipo} onChange={(event) => setQuestoes((atual) => atual.map((item, i) => i === indice ? { ...item, tipo: event.target.value as QuestaoProvaInput['tipo'], alternativas: event.target.value === 'DISSERTATIVA' ? [] : item.alternativas?.length ? item.alternativas : [{ texto: '', isCorreta: false }, { texto: '', isCorreta: false }] } : item))}>
                    <option value="MULTIPLA_ESCOLHA">Quiz (Múltipla escolha)</option>
                    <option value="DISSERTATIVA">Dissertativa (Texto aberto)</option>
                  </select>
                </label>
                {questao.tipo === 'MULTIPLA_ESCOLHA' && (
                  <div className="mt-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Alternativas</p>
                    {(questao.alternativas ?? []).map((alternativa, alternativaIndice) => (
                      <div key={alternativaIndice} className="flex items-center gap-3">
                        <input className={`${campoClass} mt-0`} value={alternativa.texto} placeholder={`Alternativa ${alternativaIndice + 1}`} required onChange={(event) => setQuestoes((atual) => atual.map((item, i) => i === indice ? { ...item, alternativas: item.alternativas?.map((alt, j) => j === alternativaIndice ? { ...alt, texto: event.target.value } : alt) } : item))} />
                        <label className="flex shrink-0 items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={alternativa.isCorreta} onChange={(event) => setQuestoes((atual) => atual.map((item, i) => i === indice ? { ...item, alternativas: item.alternativas?.map((alt, j) => ({ ...alt, isCorreta: j === alternativaIndice ? event.target.checked : event.target.checked ? false : alt.isCorreta })) } : item))} className="size-4 accent-[#b2ff00]" /> Correta</label>
                        <button type="button" aria-label="Remover alternativa" onClick={() => setQuestoes((atual) => atual.map((item, i) => i === indice ? { ...item, alternativas: item.alternativas?.filter((_, j) => j !== alternativaIndice) } : item))} className="text-slate-500 hover:text-rose-300"><Trash2 size={15} /></button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setQuestoes((atual) => atual.map((item, i) => i === indice ? { ...item, alternativas: [...(item.alternativas ?? []), { texto: '', isCorreta: false }] } : item))} className="text-xs font-semibold text-[#d5ff86] hover:text-white">+ Adicionar alternativa</button>
                  </div>
                )}
              </article>
            ))}
            {!questoes.length && <p className="rounded-lg border border-dashed border-[#35465c] p-5 text-center text-sm text-slate-500">Nenhuma questão adicionada.</p>}
          </div>
        </section>
      )}

      {erro && <p role="alert" className="mt-4 text-sm text-rose-300">{erro}</p>}

      <div className="mt-6 flex justify-end">
        <button type="submit" disabled={salvando || trilhas.length === 0} className="rounded-lg bg-[#b2ff00] px-4 py-2.5 text-sm font-semibold text-[#132000] transition hover:bg-[#c7ff4b] disabled:cursor-not-allowed disabled:opacity-60">
          {salvando ? 'Salvando…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
