'use client'

import { LoadingScreen } from '@/components/ui/loading-screen'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ActivityShell } from '@/components/activities/activity-shell'
import { ProvaPlayer } from '@/components/provas/prova-player'
import { ProvaResult } from '@/components/provas/prova-result'
import '@/components/provas/provas.css'
import { buscarProva, listarMinhasTentativas, buscarResultadoTentativa, type ProvaDetalhe, type ResultadoTentativa } from '@/lib/provas-api'

export default function ProvaPage() {
  const params = useParams()
  const provaId = Array.isArray(params.provaId) ? params.provaId[0] : params.provaId
  const [prova, setProva] = useState<ProvaDetalhe | null>(null)
  const [resultado, setResultado] = useState<ResultadoTentativa | null>(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!provaId) return
    let ativo = true
    setCarregando(true)
    setErro('')
    setProva(null)
    setResultado(null)
    listarMinhasTentativas()
      .then(async (tentativas) => {
        const tentativa = tentativas.find((item) => item.provaId === provaId && item.concluidoEm)
        if (tentativa) {
          const salvo = await buscarResultadoTentativa(tentativa.tentativaId)
          if (ativo) setResultado(salvo)
        } else {
          const detalhe = await buscarProva(provaId)
          if (ativo) setProva(detalhe)
        }
      })
      .catch((e) => { if (ativo) setErro(e instanceof Error ? e.message : 'Erro ao carregar.') })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [provaId])

  return (
    <ActivityShell section="avaliacoes" title={resultado?.provaTitulo || prova?.titulo || 'Sua próxima conquista.'} description={resultado ? 'Avaliação concluída. Confira sua nota e revise as explicações.' : prova?.descricao || 'Responda no seu ritmo. Sua nota será calculada e salva ao finalizar.'} back="/avaliacoes">
      {carregando && <LoadingScreen label={"Carregando avaliação..."} />}
      {erro && <p className="prova-erro" style={{ textAlign: 'center' }}>{erro}</p>}
      {resultado ? <ProvaResult resultado={resultado} /> : prova && <ProvaPlayer prova={prova} />}
    </ActivityShell>
  )
}
