"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { BookOpen, Check, LockKeyhole } from "lucide-react";
import { DashboardNavigation } from "@/components/dashboard-navigation";
import { apiFetch, type TrackSummary } from "@/lib/api";
import { CourseCarousel } from "@/components/course-carousel";
import { unlockedLearningCourses } from '@/lib/course-access';
import { courseButtonLabel } from '@/lib/course-status';
import './aulas.css';

const levels = [
  {
    key: "BASICO",
    title: "Nível Iniciante",
    description:
      "Fundamentos essenciais para você começar sua jornada em cibersegurança.",
    color: "#24b4ff",
    image: "url('/trilha-basico-bg.png')",
  },
  {
    key: "INTERMEDIARIO",
    title: "Nível Intermediário",
    description: "Aprofunde seus conhecimentos e coloque a teoria em prática.",
    color: "#ffd34e",
    image: "url('/trilha-intermediario-bg.png')",
  },
  {
    key: "AVANCADO",
    title: "Nível Avançado",
    description: "Desafios reais e conteúdos avançados para profissionais.",
    color: "#ff4654",
    image: "url('/trilha-avancado-bg.png')",
  },
] as const;

export default function AulasPage() {
  const [tracks, setTracks] = useState<TrackSummary[]>([]);
  const unlocked = unlockedLearningCourses(tracks);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    apiFetch("/trilhas", { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error("Entre na sua conta para carregar as aulas.");
        setTracks(await response.json());
      })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Não foi possível carregar as aulas."); });
    return () => controller.abort();
  }, []);

  return (
    <main className="app-shell dashboard-page learning-paths-page">
      <DashboardNavigation active="aulas" />
      <section className="learning-paths content-wrap">
        <header className="paths-hero">
          <div>
            <h1>Trilhas de aprendizagem</h1>
            <p>Avance do básico ao avançado. Cada nível libera o próximo quando todas as trilhas dele forem concluídas.</p>
          </div>
          <ol className="paths-journey" aria-label="Progresso por nível">
            {levels.map((level) => {
              const doNivel = tracks.filter((track) => track.nivel === level.key);
              const media = doNivel.length ? Math.round(doNivel.reduce((total, track) => total + track.percentual, 0) / doNivel.length) : 0;
              return (
                <li key={level.key} className={media === 100 ? "is-done" : media > 0 ? "is-active" : undefined} style={{ "--level-color": level.color } as CSSProperties}>
                  <span className="paths-journey-dot" aria-hidden="true">{media === 100 ? <Check size={14} strokeWidth={3} /> : null}</span>
                  <strong>{level.title.replace("Nível ", "")}</strong>
                  <small>{media}% concluído</small>
                </li>
              );
            })}
          </ol>
        </header>
        {error && <p role="alert">{error}</p>}
        {levels.map((level) => {
          const levelTracks = tracks.filter((track) => track.nivel === level.key);
          const finished = levelTracks.filter((track) => track.percentual === 100).length;
          const average = levelTracks.length ? Math.round(levelTracks.reduce((total, track) => total + track.percentual, 0) / levelTracks.length) : 0;
          return (
          <section
            className="learning-level learning-level-cards-only"
            key={level.key}
            style={{ "--level-color": level.color } as CSSProperties}
          >
            <header className="learning-level-header">
              <div>
                <h2>{level.title}</h2>
                <p>{level.description}</p>
              </div>
              {levelTracks.length > 0 && (
                <div className="learning-level-summary" aria-label={`${average}% do ${level.title.toLowerCase()} concluído`}>
                  <span>{finished} de {levelTracks.length} {levelTracks.length === 1 ? "trilha concluída" : "trilhas concluídas"}</span>
                  <div className="learning-level-bar"><span style={{ width: `${average}%` }} /></div>
                </div>
              )}
            </header>
            <CourseCarousel label={level.title}>
              {levelTracks.map((track) => (
                  <article
                    key={track.id}
                    className={`learning-path-card ${!unlocked.includes(track.id) ? "is-locked" : ""} ${track.percentual === 100 ? "is-done" : ""}`}
                    style={{ "--track-image": level.image } as CSSProperties}
                  >
                    <div className="learning-path-image" />
                    <div className="learning-path-body">
                      <span className="learning-path-badge">
                        {level.key === "BASICO"
                          ? "INICIANTE"
                          : level.key === "INTERMEDIARIO"
                            ? "INTERMEDIÁRIO"
                            : "AVANÇADO"}
                      </span>
                      <h2>{track.titulo}</h2>
                      <p>{track.descricao}</p>
                      <div className="learning-path-meta">
                        <span>
                          <BookOpen size={15} /> {track.totalAulas} aulas
                        </span>
                        <strong>{track.percentual === 100 ? <><Check size={13} strokeWidth={3} /> Concluída</> : `${track.percentual}%`}</strong>
                      </div>
                      <div className="learning-path-progress" aria-hidden="true"><span style={{ width: `${track.percentual}%` }} /></div>
                      {!unlocked.includes(track.id) ? (
                        <span className="learning-path-lock">
                          <LockKeyhole size={14} /> Conclua a trilha anterior
                        </span>
                      ) : (
                        <Link href={`/aulas/modulo/${track.id}`}>
                          {courseButtonLabel(track.percentual, track.percentual > 0)}
                        </Link>
                      )}
                    </div>
                  </article>
                ))}
            </CourseCarousel>
          </section>
          );
        })}
      </section>
    </main>
  );
}
