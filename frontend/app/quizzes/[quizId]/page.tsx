"use client";
import { use, useCallback } from "react";
import { buscarQuiz } from "@/lib/quizzes-api";
import { ActivityShell } from "@/components/activities/activity-shell";
import {
  ActivityError,
  ActivityLoading,
} from "@/components/activities/activity-state";
import { useActivity } from "@/components/activities/use-activity";
import { QuizPlayer } from "@/components/quizzes/quiz-player";
import { findLocalQuiz } from "@/lib/library-activities";
export default function QuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = use(params);
  const loader = useCallback(
    (signal: AbortSignal) => {
      const local = findLocalQuiz(quizId);
      return local ? Promise.resolve(local) : buscarQuiz(quizId, signal);
    },
    [quizId],
  );
  const { data, error, loading, retry } = useActivity(loader);
  return (
    <ActivityShell
      section="quizzes"
      title={data?.titulo || "Quiz educativo"}
      description={
        data?.descricao ||
        "Prepare-se para colocar seus conhecimentos em prática."
      }
      back="/quizzes"
    >
      {loading ? (
        <ActivityLoading />
      ) : error ? (
        <ActivityError error={error} retry={retry} />
      ) : (
        data && (
          <>
            <p className="activity-lesson activity-detail-lesson">
              Aula: {data.aula.titulo}
            </p>
            <QuizPlayer key={data.id} quiz={data} />
          </>
        )
      )}
    </ActivityShell>
  );
}
