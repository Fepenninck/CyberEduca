'use client'

import { useState } from 'react'
import { ArrowRight, PlayCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import type { LessonMaterial } from '@/lib/lesson-material'
import { apresentarOrientacao } from '@/lib/lesson-presentation'

export function LessonDiagram({ diagram }: { diagram: NonNullable<LessonMaterial['diagram']> }) {
  return <section aria-label={diagram.title} className="rounded-2xl bg-white/[0.03] p-5">
    <h3 className="!mt-0">{diagram.title}</h3>
    <ol className="!m-0 flex !list-none flex-col gap-3 !p-0 sm:flex-row">
      {diagram.nodes.map((node, index) => <li key={`${index}-${node}`} className="!m-0 flex min-w-0 flex-1 items-center gap-2">
        <div className="h-full min-w-0 flex-1 rounded-xl bg-[#0d1623] p-4">
          <span className="text-xs text-sky-300">{String(index + 1).padStart(2, '0')}</span>
          <strong className="mt-2 block text-sm text-white">{node}</strong>
          <span className="mt-2 block text-xs leading-5 text-slate-400">{diagram.notes[index]}</span>
        </div>
        {index < diagram.nodes.length - 1 && <ArrowRight size={16} className="hidden shrink-0 text-sky-300 sm:block" aria-hidden="true" />}
      </li>)}
    </ol>
    <p className="!mb-0 text-sm text-slate-400">{diagram.caption}</p>
  </section>
}

export function LessonVideo({ video, poster, atividadeNaPagina = false }: { video: NonNullable<LessonMaterial['video']>; poster?: string; atividadeNaPagina?: boolean }) {
  const [error, setError] = useState(false)
  return <section className="lesson-video-material">
    <h2 className="flex items-center gap-2"><PlayCircle size={22} aria-hidden="true" /> Veja em um vídeo curto</h2>
    <p>{video.title}</p>
    {!error && <video controls playsInline preload="none" poster={poster} onError={() => setError(true)} aria-label={video.title} className="w-full rounded-xl !border-0">
      <source src={video.url} type="video/mp4" />
      Seu navegador não oferece suporte a este vídeo. Use a fonte abaixo para assistir.
    </video>}
    {error && <p role="status">O vídeo não carregou aqui. Use a página oficial abaixo, que também tem uma descrição em texto.</p>}
    <p className="lesson-source-link"><a href={video.source} target="_blank" rel="noreferrer">Assistir na fonte e ler a descrição acessível</a></p>
    {video.prompt.trim() && <div className="rounded-xl bg-white/5 p-4 text-sm"><h3 className="!mt-0">Observe enquanto assiste</h3><ReactMarkdown>{atividadeNaPagina ? video.prompt : apresentarOrientacao(video.prompt)}</ReactMarkdown></div>}
  </section>
}
