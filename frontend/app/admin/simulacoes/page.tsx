'use client'

import { MailWarning, ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FormularioCenarioPhishing } from '@/components/admin/formulario-cenario-phishing'
import {
  criarCenarioAdmin,
  listarCenariosAdmin,
  type CenarioPhishingAdmin,
  type CenarioPhishingInput,
} from '@/lib/admin-api'

const rotulosDificuldade: Record<string, string> = {
  FACIL: 'Fácil',
  MEDIO: 'Médio',
  DIFICIL: 'Difícil',
}

export default function AdminSimulacoesPage() {
  const [cenarios, setCenarios] = useState<CenarioPhishingAdmin[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [atualizacao, setAtualizacao] = useState(0)

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    setErro(null)

    listarCenariosAdmin()
      .then((dados) => {
        if (ativo) setCenarios(dados)
      })
      .catch((erroBusca: unknown) => {
        if (ativo) setErro(erroBusca instanceof Error ? erroBusca.message : 'Não foi possível carregar os cenários.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [atualizacao])

  async function salvarCenario(dados: CenarioPhishingInput) {
    await criarCenarioAdmin(dados)
    setSucesso('Cenário criado com sucesso.')
    setAtualizacao((valor) => valor + 1)
  }

  return (
    <section>
      <div className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b2ff00]">Treinamento prático</p>
        <h2 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-white">
          <ShieldAlert aria-hidden="true" className="text-[#b2ff00]" size={28} /> Simulações de phishing
        </h2>
        <p className="mt-2 text-sm text-slate-400">Cadastre cenários fictícios para os exercícios de identificação de phishing.</p>
      </div>

      {sucesso && <p role="status" className="mb-5 rounded-xl border border-[#b2ff00]/25 bg-[#b2ff00]/[0.07] px-4 py-3 text-sm text-[#d8ff8a]">{sucesso}</p>}
      {erro && <p role="alert" className="mb-5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{erro}</p>}

      <div className="mb-10">
        <h3 className="mb-3 text-lg font-semibold text-white">Novo cenário</h3>
        <FormularioCenarioPhishing
          onSubmit={async (dados) => {
            setSucesso(null)
            await salvarCenario(dados)
          }}
        />
      </div>

      <div className="mb-4 flex items-center gap-3">
        <MailWarning aria-hidden="true" className="text-slate-300" size={20} />
        <h3 className="text-xl font-semibold text-white">Cenários cadastrados</h3>
      </div>

      {carregando ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl border border-[#29394f] bg-[#101b2a]" />)}
        </div>
      ) : cenarios.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {cenarios.map((cenario) => (
            <article key={cenario.id} className="rounded-2xl border border-[#29394f] bg-[#101b2a] p-5">
              <div className="flex items-start justify-between gap-3">
                <h4 className="font-semibold text-white">{cenario.titulo}</h4>
                <span className="shrink-0 rounded-full bg-amber-300/10 px-2.5 py-1 text-xs font-medium text-amber-200">
                  {rotulosDificuldade[cenario.dificuldade] ?? cenario.dificuldade}
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-400">Remetente: <span className="text-slate-300">{cenario.remetenteFalso}</span></p>
              <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-5 text-slate-400">{cenario.conteudoEmail}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#35465c] px-6 py-12 text-center">
          <MailWarning className="mx-auto text-slate-500" size={28} />
          <p className="mt-3 font-medium text-white">Nenhum cenário cadastrado</p>
          <p className="mt-1 text-sm text-slate-400">Use o formulário acima para adicionar um cenário fictício.</p>
        </div>
      )}
    </section>
  )
}
