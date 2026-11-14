'use client'

import { useCallback } from 'react'
import { listarQuizzes, buscarQuiz } from '@/lib/quizzes-api'
import { QuizPlayer } from '@/components/quizzes/quiz-player'
import { useActivity } from './use-activity'
import { ActivityError, ActivityLoading } from './activity-state'
import './activities.css'

export function LessonExercise({ aulaId }: { aulaId: string }) {
  const loader = useCallback(async (signal: AbortSignal) => {
    const quizzes = await listarQuizzes(aulaId, signal)
    if (!quizzes.length) throw new Error('A atividade desta aula ainda não está disponível.')
    return buscarQuiz(quizzes[0].id, signal)
  }, [aulaId])
  const { data, error, loading, retry } = useActivity(loader)
  return <section aria-label="Atividade da aula">
    {loading ? <ActivityLoading /> : error ? <ActivityError error={error} retry={retry} /> : data && <QuizPlayer key={data.id} quiz={data} />}
  </section>
}
