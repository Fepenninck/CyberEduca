"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { BookOpen, LockKeyhole } from "lucide-react";
import { DashboardNavigation } from "@/components/dashboard-navigation";
import { apiFetch, type TrackSummary } from "@/lib/api";
import { CourseCarousel } from "@/components/course-carousel";
import { unlockedLearningCourses } from '@/lib/course-access';
import { courseButtonLabel } from '@/lib/course-status';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    apiFetch("/trilhas", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Entre na sua conta para carregar as aulas.");
        setTracks(await response.json());
      })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Não foi possível carregar as aulas."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  return (
    <main className="app-shell dashboard-page">
      <DashboardNavigation active="aulas" />
      <section className="learning-paths content-wrap">
        {loading && <p className="results-line">Carregando trilhas...</p>}
        {error && <p role="alert">{error}</p>}
        {levels.map((level) => (
          <section
            className="learning-level learning-level-cards-only"
            key={level.key}
            style={{ "--level-color": level.color } as CSSProperties}
          >
            <h1 className="sr-only">{level.title}</h1>
            <CourseCarousel label={level.title}>
              {tracks
                .filter((track) => track.nivel === level.key)
                .map((track) => (
                  <article
                    key={track.id}
                    className={`learning-path-card ${!unlocked.includes(track.id) ? "is-locked" : ""}`}
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
                        <strong>{track.percentual}%</strong>
                      </div>
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
            {!loading && !error && !tracks.some(track => track.nivel === level.key) && <article className="learning-path-card learning-path-soon"><div className="learning-path-body"><span>EM BREVE</span><h2>Nova trilha</h2><p>Novos conte?dos ser?o disponibilizados em breve.</p></div></article>}
            </CourseCarousel>
          </section>
        ))}
      </section>
    </main>
  );
}
