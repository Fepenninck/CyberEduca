"use client";
import { useCallback } from "react";
import { ActivityShell } from "@/components/activities/activity-shell";
import {
  ActivityEmpty,
  ActivityError,
  ActivityLoading,
} from "@/components/activities/activity-state";
import { useActivity } from "@/components/activities/use-activity";
import { QuizCard } from "@/components/quizzes/quiz-card";
import { listarQuizzes } from "@/lib/quizzes-api";
export default function QuizzesPage() {
  const loader = useCallback(
    (signal: AbortSignal) =>
      listarQuizzes(
        new URLSearchParams(window.location.search).get("aulaId") || undefined,
        signal,
      ),
    [],
  );
  const { data, error, loading, retry } = useActivity(loader);
  return (
    <ActivityShell
      section="quizzes"
      title="Conhecimento que vira prática."
      description="Revise o que aprendeu nas aulas. Responda no seu ritmo e entenda cada escolha com um feedback explicado."
    >
      <div className="activity-section-label">
        <h2>Quizzes publicados na sua conta</h2>
        <span>
          {data ? `${data.length} atividades` : "Atividades das aulas"}
        </span>
      </div>
      {loading ? (
        <ActivityLoading />
      ) : error ? (
        <ActivityError error={error} retry={retry} />
      ) : data?.length ? (
        <div className="activity-grid">
          {data.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      ) : (
        <ActivityEmpty>
          Os quizzes aparecerão aqui quando forem publicados para suas aulas.
        </ActivityEmpty>
      )}
    </ActivityShell>
  );
}
