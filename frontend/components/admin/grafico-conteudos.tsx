'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ResumoDashboard } from '@/lib/admin-api'

export default function GraficoConteudos({ resumo }: { resumo: ResumoDashboard }) {
  return (
    <article className="mt-8 rounded-2xl border border-[#29394f] bg-[#121e2e] p-6">
      <h3 className="text-xl font-semibold text-white">Conteúdos cadastrados</h3>
      <p className="mt-2 text-sm text-slate-400">Distribuição entre trilhas e aulas.</p>
      {resumo.totalTrilhas + resumo.totalAulas === 0 ? (
        <p className="mt-6 text-slate-400">Nenhum conteúdo cadastrado.</p>
      ) : (
        <div className="mt-6 h-64" role="img" aria-label={`${resumo.totalTrilhas} trilhas e ${resumo.totalAulas} aulas cadastradas`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[{ nome: 'Trilhas', total: resumo.totalTrilhas }, { nome: 'Aulas', total: resumo.totalAulas }]}>
              <CartesianGrid stroke="#29394f" vertical={false} />
              <XAxis dataKey="nome" stroke="#94a3b8" />
              <YAxis allowDecimals={false} stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: '#121e2e', borderColor: '#29394f', color: '#fff' }} />
              <Bar dataKey="total" name="Quantidade" fill="#b2ff00" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  )
}
