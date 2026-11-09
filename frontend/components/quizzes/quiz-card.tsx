import Link from "next/link";
import { ArrowUpRight, BookOpenCheck, ListChecks } from "lucide-react";
import type { QuizResumo } from "@/lib/quizzes-api";
export function QuizCard({ quiz }: { quiz: QuizResumo }) {
  return (
    <article className="activity-card">
      <div className="activity-card-icon">
        <BookOpenCheck size={26} />
      </div>
      <span className="activity-kicker">QUIZ EDUCATIVO</span>
      <h2>{quiz.titulo}</h2>
      <p>{quiz.descricao}</p>
      <div className="activity-card-meta">
        <ListChecks size={16} /> {quiz._count.questoes}{" "}
        {quiz._count.questoes === 1 ? "questão" : "questões"}
      </div>
      <span className="activity-lesson">{quiz.aula.titulo}</span>
      <Link className="activity-card-link" href={`/quizzes/${quiz.id}`}>
        Responder quiz <ArrowUpRight size={18} />
        <span className="sr-only">: {quiz.titulo}</span>
      </Link>
    </article>
  );
}
