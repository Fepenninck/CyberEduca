'use client'

import { LessonSources } from './lesson-sources'
import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { LessonDiagram, LessonVideo } from './lesson-media'
import ReactMarkdown from 'react-markdown'
import type { LessonMaterial } from '@/lib/lesson-material'
import { lessonHeadings } from '@/lib/lesson-headings'

export function IntroductoryLesson({ lesson }: { lesson: LessonMaterial }) {
  const [answer, setAnswer] = useState<number | null>(null)
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

      {lesson.diagram && <LessonDiagram diagram={lesson.diagram} />}

      <section className="rounded-2xl bg-sky-300/5 p-5">
        <h3 className="!mt-0">Acompanhe a história da Ana</h3>
        <ReactMarkdown>{lesson.caseStudy ?? ''}</ReactMarkdown>
      </section>

      {lesson.video && <LessonVideo key={lesson.video.url} video={lesson.video} poster={intro.image.src} atividadeNaPagina />}

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
