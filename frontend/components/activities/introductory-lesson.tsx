'use client'

import { LessonSources } from './lesson-sources'
import { useState } from 'react'
import { ArrowRight, CheckCircle2, PlayCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import type { LessonMaterial } from '@/lib/lesson-material'
import { lessonHeadings } from '@/lib/lesson-headings'

export function IntroductoryLesson({ lesson }: { lesson: LessonMaterial }) {
  const [answer, setAnswer] = useState<number | null>(null)
  const [videoError, setVideoError] = useState(false)
  const intro = lesson.introductory!
  const headings = lessonHeadings(lesson)

  return (
    <div className="space-y-8">
      <figure className="!m-0 overflow-hidden rounded-2xl bg-[#142235]">
        <img src={intro.image.src} alt={intro.image.alt} width={960} height={480} className="!m-0 !w-full" />
        <figcaption className="px-5 py-3 text-xs text-slate-400">{intro.image.caption} Ilustração original CyberEduca+.</figcaption>
      </figure>

      <section>
        <h2>{headings.concept}</h2>
        <ReactMarkdown>{lesson.concept}</ReactMarkdown>
      </section>

      {lesson.diagram && (
        <section aria-label={lesson.diagram.title} className="rounded-2xl bg-white/[0.03] p-5">
          <h3 className="!mt-0">{lesson.diagram.title}</h3>
          <ol className="!m-0 flex !list-none flex-col gap-3 !p-0 sm:flex-row">
            {lesson.diagram.nodes.map((node, i) => (
              <li key={node} className="!m-0 flex min-w-0 flex-1 items-center gap-2">
                <div className="h-full flex-1 rounded-xl bg-[#0d1623] p-4">
                  <span className="text-xs text-sky-300">0{i + 1}</span>
                  <strong className="mt-2 block text-sm text-white">{node}</strong>
                  <span className="mt-2 block text-xs leading-5 text-slate-400">{lesson.diagram!.notes[i]}</span>
                </div>
                {i < lesson.diagram!.nodes.length - 1 && <ArrowRight size={16} className="hidden shrink-0 text-sky-300 sm:block" aria-hidden="true" />}
              </li>
            ))}
          </ol>
          <p className="!mb-0 text-sm text-slate-400">{lesson.diagram.caption}</p>
        </section>
      )}

      <section className="rounded-2xl bg-sky-300/5 p-5">
        <h3 className="!mt-0">Acompanhe a história da Ana</h3>
        <ReactMarkdown>{lesson.caseStudy ?? ''}</ReactMarkdown>
      </section>

      {lesson.video && (
        <section className="lesson-video-material">
          <h2 className="flex items-center gap-2"><PlayCircle size={22} aria-hidden="true" /> Veja em um vídeo curto</h2>
          <p>{lesson.video.title}</p>
          {!videoError && <video key={lesson.video.url} controls playsInline preload="none" poster={intro.image.src} onError={() => setVideoError(true)} aria-label={lesson.video.title} className="w-full rounded-xl !border-0">
            <source src={lesson.video.url} type="video/mp4" />
          </video>}
          {videoError && <p role="status">O vídeo não carregou aqui. Use a página oficial abaixo, que também tem uma descrição em texto.</p>}
          <p className="lesson-source-link"><a href={lesson.video.source} target="_blank" rel="noreferrer">Assistir na fonte e ler a descrição acessível</a></p>
          <p className="rounded-xl bg-white/5 p-4 text-sm"><strong>Observe enquanto assiste: </strong>{lesson.video.prompt}</p>
        </section>
      )}

      <section className="rounded-2xl bg-[#b2ff00]/5 p-5">
        <h2 className="!mt-0">E você, o que faria?</h2>
        <p>{intro.checkpoint.question}</p>
        <div role="group" aria-label="Escolha uma resposta" className="grid gap-3">
          {intro.checkpoint.options.map((option, i) => <button key={option} type="button" aria-pressed={answer === i} onClick={() => setAnswer(i)} className={`rounded-xl border-0 p-4 text-left text-sm transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300 ${answer === i ? 'bg-sky-300/10 text-white' : 'bg-[#0d1623] text-slate-200 hover:bg-white/5'}`}>
            <span className="mr-2 text-sky-300">{String.fromCharCode(65 + i)}.</span>{option}
          </button>)}
        </div>
        {answer !== null && <div role="status" className="mt-4 rounded-xl bg-[#0d1623] p-4 text-sm">
          <strong className={answer === intro.checkpoint.correct ? 'text-[#b2ff00]' : 'text-amber-200'}>{answer === intro.checkpoint.correct ? 'Boa escolha!' : 'Vamos pensar juntos?'}</strong>
          <p className="!mb-0">{intro.checkpoint.explanation}</p>
        </div>}
        <p className="!mb-0 text-xs text-slate-400">Atividade livre, sem nota. Sua escolha não é salva e não altera o progresso da aula.</p>
      </section>

      <section><h2>Experimente em um minuto</h2><ReactMarkdown>{lesson.practice}</ReactMarkdown></section>
      <aside className="flex items-start gap-3 rounded-xl bg-sky-300/10 p-5"><CheckCircle2 className="mt-1 shrink-0 text-sky-300" size={22} aria-hidden="true" /><div><strong>Para levar para a próxima aula</strong><p className="!mb-0">{intro.takeaway}</p></div></aside>
      <LessonSources lesson={lesson} />
    </div>
  )
}
