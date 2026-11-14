'use client'

import { SimpleLoading } from '@/components/ui/simple-loading'
import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  obterEstatisticasDificuldade,
  type EstatisticaDificuldade,
} from '@/lib/admin-api'

function corDaNota(nota: number) {
  if (nota < 40) return '#f87171'
  if (nota < 70) return '#fb923c'
  return '#b2ff00'
}

export default function GraficoDificuldades() {
  const [dados, setDados] = useState<EstatisticaDificuldade[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true

    obterEstatisticasDificuldade()
      .then((resultado) => {
        if (ativo) setDados(resultado)
      })
      .catch((erroBusca: unknown) => {
        if (ativo) {
          setErro(erroBusca instanceof Error ? erroBusca.message : 'Não foi possível carregar as estatísticas.')
        }
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [])

  return (
    <section className="mt-8 rounded-2xl border border-[#29394f] bg-gradient-to-br from-[#121e2e] to-[#0d1623] p-6 shadow-[0_18px_50px_-32px_rgba(0,0,0,0.9)]">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-orange-300">
          Desempenho
        </p>
        <h3 className="mt-2 text-xl font-semibold text-white">Dificuldades nas avaliações</h3>
        <p className="mt-1 text-sm text-slate-400">
          Nota média por prova, da menor para a maior. Notas baixas indicam temas que podem precisar de reforço.
        </p>
      </div>

      {carregando ? (
        <SimpleLoading />
      ) : erro ? (
        <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100">
          {erro}
        </p>
      ) : dados.length === 0 ? (
        <p className="rounded-xl border border-white/[0.07] p-6 text-sm text-slate-400">
          Ainda não há resultados de provas para calcular as médias.
        </p>
      ) : (
        <div className="h-80 w-full" role="img" aria-label="Gráfico da nota média por prova">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dados} margin={{ top: 8, right: 12, left: 0, bottom: 56 }}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="titulo"
                interval={0}
                angle={-28}
                textAnchor="end"
                height={72}
                tick={{ fill: '#cbd5e1', fontSize: 12 }}
                axisLine={{ stroke: '#475569' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(valor: number) => `${valor}%`}
              />
              <Tooltip
                cursor={{ fill: '#ffffff', fillOpacity: 0.04 }}
                contentStyle={{ background: '#0d1623', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc' }}
                formatter={(valor) => [`${Number(valor).toFixed(1)}%`, 'Nota média']}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="mediaNota" name="Nota média" radius={[6, 6, 0, 0]}>
                {dados.map((item) => (
                  <Cell key={item.provaId} fill={corDaNota(item.mediaNota)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}
