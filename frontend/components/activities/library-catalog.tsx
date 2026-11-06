"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, BookOpenCheck } from "lucide-react";
import {
  libraryCourses,
  levelNames,
  type CourseLevel,
} from "@/lib/course-library";
import { libraryQuizzes, localScenarios } from "@/lib/library-activities";
export function LibraryQuizCatalog() {
  const [level, setLevel] = useState<CourseLevel | "TODOS">("TODOS");
  return (
    <section className="library-section">
      <div className="activity-section-label">
        <h2>Práticas da biblioteca</h2>
        <span>
          {libraryQuizzes.length} quizzes ·{" "}
          {libraryQuizzes.reduce((sum, quiz) => sum + quiz.questoes.length, 0)}{" "}
          questões
        </span>
      </div>
      <p className="activity-muted">
        Atividades disponíveis para praticar agora. Correção local, sem envio
        das respostas ao servidor.
      </p>
      <LevelFilter value={level} onChange={setLevel} />
      <div className="activity-grid">
        {libraryQuizzes
          .filter(
            (q) =>
              level === "TODOS" ||
              libraryCourses.find((c) => c.id === q.aulaId)?.level === level,
          )
          .map((q) => (
            <article className="activity-card" key={q.id}>
              <div className="activity-card-icon">
                <BookOpenCheck size={25} />
              </div>
              <span className="activity-kicker">
                {
                  levelNames[
                    libraryCourses.find((c) => c.id === q.aulaId)!.level
                  ]
                }
              </span>
              <h2>{q.titulo}</h2>
              <p>{q.descricao}</p>
              <span className="activity-lesson">
                {q.questoes.length} questões · prática local
              </span>
              <Link href={`/quizzes/${q.id}`} className="activity-card-link">
                Começar quiz <ArrowUpRight size={18} />
              </Link>
            </article>
          ))}
      </div>
    </section>
  );
}
export function LevelFilter({
  value,
  onChange,
}: {
  value: CourseLevel | "TODOS";
  onChange: (level: CourseLevel | "TODOS") => void;
}) {
  return (
    <div className="activity-filter" aria-label="Filtrar por nível">
      {(["TODOS", "BASICO", "INTERMEDIARIO", "AVANCADO"] as const).map(
        (level) => (
          <button
            key={level}
            aria-pressed={value === level}
            onClick={() => onChange(level)}
          >
            {level === "TODOS" ? "Todos os níveis" : levelNames[level]}
          </button>
        ),
      )}
    </div>
  );
}
export function LocalSimulationCatalog() {
  const [level, setLevel] = useState<CourseLevel | "TODOS">("TODOS");
  return (
    <section className="library-section">
      <div className="activity-section-label">
        <h2>Laboratório de cenários</h2>
        <span>12 simulações</span>
      </div>
      <p className="activity-muted">
        Cenários fictícios com sinais reais de engenharia social. Feedback
        local, sem envio ao servidor.
      </p>
      <LevelFilter value={level} onChange={setLevel} />
      <div className="activity-grid">
        {localScenarios
          .filter((s) => level === "TODOS" || s.level === level)
          .map((s) => (
            <article className="activity-card" key={s.id}>
              <span className="activity-kicker">
                {levelNames[s.level]} · {s.tipo.replace("_", " ")}
              </span>
              <h2>{s.titulo}</h2>
              <p>{s.descricao}</p>
              <Link href={`/simulacoes/${s.id}`} className="activity-card-link">
                Analisar cenário <ArrowUpRight size={18} />
              </Link>
            </article>
          ))}
      </div>
    </section>
  );
}
