import Link from "next/link";
import type { QuizResumo } from "@/lib/quizzes-api";
export function QuizCard({ quiz }: { quiz: QuizResumo }) {
  const tentativa = quiz.tentativas?.[0];
  return (
    <article className="activity-card">
      <span className="activity-kicker">{quiz.aula.titulo}</span>
      <h2>{quiz.titulo}</h2>
      <p>{quiz.descricao}</p>
      <div className="activity-card-footer">
        <span>{quiz._count.questoes} {quiz._count.questoes === 1 ? "questão" : "questões"}</span>
        {tentativa && <span className="activity-status">{tentativa.totalAcertos} de {tentativa.totalQuestoes} acertos</span>}
      </div>
      <Link className="activity-card-link" href={`/quizzes/${quiz.id}`}>
        {tentativa ? "Ver resultado" : "Responder quiz"}
        <span className="sr-only">: {quiz.titulo}</span>
      </Link>
    </article>
  );
}
