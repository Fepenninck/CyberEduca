'use client'

import { BarChart3, ClipboardCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  listarResultadosProvas,
  listarResultadosSimulacoes,
  type ResultadoProvaAdmin,
  type ResultadoSimulacaoAdmin,
} from '@/lib/admin-api'

type AbaResultados = 'provas' | 'simulacoes'

function formatarData(data: string) {
  return new Date(data).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export default function AdminResultadosPage() {
  const [aba, setAba] = useState<AbaResultados>('provas')
  const [resultadosProvas, setResultadosProvas] = useState<ResultadoProvaAdmin[]>([])
  const [resultadosSimulacoes, setResultadosSimulacoes] = useState<ResultadoSimulacaoAdmin[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    Promise.all([listarResultadosProvas(), listarResultadosSimulacoes()])
      .then(([provas, simulacoes]) => {
        if (!ativo) return
        setResultadosProvas(provas)
        setResultadosSimulacoes(simulacoes)
      })
      .catch((falha: unknown) => {
        if (ativo) setErro(falha instanceof Error ? falha.message : 'Não foi possível carregar os resultados.')
      })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [])

  const linhas = aba === 'provas'
    ? resultadosProvas.map((resultado) => ({
        id: resultado.id,
        aluno: resultado.usuario.nome,
        email: resultado.usuario.email,
        titulo: resultado.prova.titulo,
        acertos: resultado.acertos,
        total: resultado.totalQuestoes,
        criadoEm: resultado.criadoEm,
      }))
    : resultadosSimulacoes.map((resultado) => ({
        id: resultado.id,
        aluno: resultado.usuario.nome,
        email: resultado.usuario.email,
        titulo: resultado.simulacao.titulo,
        acertos: resultado.acertos,
        total: resultado.totalQuestoes,
        criadoEm: resultado.criadoEm,
      }))

  return (
    <section>
      <header className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b2ff00]">Acompanhamento</p>
        <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-white">
          <BarChart3 aria-hidden="true" className="text-[#b2ff00]" size={28} /> Resultados dos alunos
        </h1>
        <p className="mt-2 text-sm text-slate-400">Consulte as conclusões e o desempenho nas provas e simulações.</p>
      </header>

      <div className="mb-5 flex gap-2" role="tablist" aria-label="Tipo de resultado">
        {(['provas', 'simulacoes'] as const).map((tipo) => (
          <button
            key={tipo}
            id={`aba-${tipo}`}
            type="button"
            role="tab"
            aria-selected={aba === tipo}
            onClick={() => setAba(tipo)}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${aba === tipo ? 'bg-[#b2ff00] text-[#132000]' : 'border border-[#35465c] text-slate-300 hover:border-[#b2ff00] hover:text-white'}`}
          >
            {tipo === 'provas' ? 'Provas' : 'Simulações'}
          </button>
        ))}
      </div>

      {erro && <p role="alert" className="mb-5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{erro}</p>}
      <div role="tabpanel" aria-labelledby={`aba-${aba}`} className="overflow-hidden rounded-2xl border border-[#29394f] bg-[#101b2a]">
        {carregando ? (
          <div className="space-y-3 p-5" aria-label="Carregando resultados">
            {[1, 2, 3].map((item) => <div key={item} className="h-12 animate-pulse rounded-lg bg-[#0b1522]" />)}
          </div>
        ) : linhas.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[#0b1522] text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3">Nome do aluno</th>
                  <th className="px-5 py-3">E-mail</th>
                  <th className="px-5 py-3">Avaliação</th>
                  <th className="px-5 py-3">Acertos / Total</th>
                  <th className="px-5 py-3">Data da conclusão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#29394f]">
                {linhas.map((linha) => (
                  <tr key={linha.id}>
                    <td className="px-5 py-4 font-medium text-white">{linha.aluno}</td>
                    <td className="px-5 py-4 text-slate-300">{linha.email}</td>
                    <td className="px-5 py-4 text-slate-300">{linha.titulo}</td>
                    <td className="px-5 py-4 text-slate-300">{linha.acertos} / {linha.total}</td>
                    <td className="px-5 py-4 text-slate-400">{formatarData(linha.criadoEm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <ClipboardCheck aria-hidden="true" className="mx-auto text-slate-500" size={30} />
            <p className="mt-3 font-medium text-white">Ainda não há resultados nesta aba</p>
            <p className="mt-1 text-sm text-slate-400">Os resultados serão exibidos quando os alunos concluírem atividades.</p>
          </div>
        )}
      </div>
    </section>
  )
}
