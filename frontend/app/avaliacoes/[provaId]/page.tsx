'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { DashboardNavigation } from '@/components/dashboard-navigation'
import { ProvaPlayer } from '@/components/provas/prova-player'
import '@/components/provas/provas.css'
import { buscarProva, type ProvaDetalhe } from '@/lib/provas-api'

export default function ProvaPage() {
  const params = useParams()
  const provaId = Array.isArray(params.provaId) ? params.provaId[0] : params.provaId
  const [prova, setProva] = useState<ProvaDetalhe | null>(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!provaId) return
    buscarProva(provaId)
      .then(setProva)
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro ao carregar.'))
      .finally(() => setCarregando(false))
  }, [provaId])

  return (
    <main className="app-shell dashboard-page">
      <DashboardNavigation active="avaliacoes" />
      {carregando && <p className="provas-vazio" style={{ textAlign: 'center' }}>Carregando avaliação...</p>}
      {erro && <p className="prova-erro" style={{ textAlign: 'center' }}>{erro}</p>}
      {prova && <ProvaPlayer prova={prova} />}
    </main>
  )
}