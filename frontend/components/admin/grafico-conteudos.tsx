'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ResumoDashboard } from '@/lib/admin-api'

export default function GraficoConteudos({ resumo }: { resumo: ResumoDashboard }) {
  return (
    <article className="mt-8 rounded-2xl border border-[#dce1e8] bg-[#ffffff] p-6">
      <h3 className="text-xl font-semibold text-[#242a33]">Conteúdos cadastrados</h3>
      <p className="mt-2 text-sm text-[#626c79]">Distribuição entre trilhas e aulas.</p>
      {resumo.totalTrilhas + resumo.totalAulas === 0 ? (
        <p className="mt-6 text-[#626c79]">Nenhum conteúdo cadastrado.</p>
      ) : (
        <div className="mt-6 h-64" role="img" aria-label={`${resumo.totalTrilhas} trilhas e ${resumo.totalAulas} aulas cadastradas`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[{ nome: 'Trilhas', total: resumo.totalTrilhas }, { nome: 'Aulas', total: resumo.totalAulas }]}>
              <CartesianGrid stroke="#dce1e8" vertical={false} />
              <XAxis dataKey="nome" stroke="#626c79" />
              <YAxis allowDecimals={false} stroke="#626c79" />
              <Tooltip contentStyle={{ background: '#ffffff', borderColor: '#dce1e8', color: '#242a33' }} />
              <Bar dataKey="total" name="Quantidade" fill="#1768bd" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  )
}
