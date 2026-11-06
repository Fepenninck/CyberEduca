"use client";
import { use } from "react";
import { ActivityShell } from "@/components/activities/activity-shell";
import { QuizPlayer } from "@/components/quizzes/quiz-player";
import { assessments } from "@/lib/library-activities";
export default function AvaliacaoPage({
  params,
}: {
  params: Promise<{ avaliacaoId: string }>;
}) {
  const { avaliacaoId } = use(params);
  const avaliacao = assessments.find((a) => a.id === avaliacaoId);
  return (
    <ActivityShell
      section="avaliacoes"
      title={avaliacao?.titulo || "Avaliação não encontrada"}
      description={
        avaliacao?.descricao || "Escolha uma avaliação disponível na lista."
      }
      back="/avaliacoes"
    >
      {avaliacao && <QuizPlayer key={avaliacao.id} quiz={avaliacao} />}
    </ActivityShell>
  );
}
