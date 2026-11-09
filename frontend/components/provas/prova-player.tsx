'use client'

import { useState } from 'react'
import { ProvaQuestion } from './prova-question'
import { ProvaResult } from './prova-result'
import { enviarTentativa, type ProvaDetalhe, type ResultadoTentativa } from '@/lib/provas-api'
import './provas.css'

export function ProvaPlayer({ prova }: { prova: ProvaDetalhe }) {
  const [respostas, setRespostas] = useState<Record<string, string>>({})
  const [resultado, setResultado] = useState<ResultadoTentativa | null>(null)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const totalRespondidas = Object.keys(respostas).length
  const todasRespondidas = totalRespondidas === prova.questoes.length

  const selecionar = (questaoId: string, alternativaId: string) => {
    setRespostas((atual) => ({ ...atual, [questaoId]: alternativaId }))
    setErro('')
  }

  const finalizar = async () => {
    if (!todasRespondidas) {
      setErro('Responda todas as questões antes de finalizar.')
      return
    }

    setErro('')
    setEnviando(true)

    try {
      const retorno = await enviarTentativa(
        prova.id,
        Object.entries(respostas).map(([questaoId, alternativaId]) => ({
          questaoId,
          alternativaId,
        })),
      )
      setResultado(retorno)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível enviar suas respostas.')
    } finally {
      setEnviando(false)
    }
  }

  if (resultado) {
    return <ProvaResult resultado={resultado} />
  }

  return (
    <div className="prova-player">
      <header>
        <h1>{prova.titulo}</h1>
        {prova.descricao && <p>{prova.descricao}</p>}
      </header>

      <div className="prova-progresso">
        <span>{prova.trilha.titulo}</span>
        <span>{totalRespondidas} de {prova.questoes.length} respondidas</span>
      </div>

      {prova.questoes.map((questao, indice) => (
        <ProvaQuestion
          key={questao.id}
          questao={questao}
          numero={indice + 1}
          selecionada={respostas[questao.id]}
          onSelecionar={selecionar}
        />
      ))}

      {erro && <p className="prova-erro">{erro}</p>}

      <div className="prova-acoes">
        <button
          type="button"
          className="prova-submit"
          onClick={finalizar}
          disabled={enviando}
        >
          {enviando ? 'Enviando...' : 'Finalizar avaliação'}
        </button>
      </div>
    </div>
  )
}
