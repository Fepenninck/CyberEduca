"use client";

<<<<<<< HEAD
import Link from "next/link";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { BookOpen, LockKeyhole } from "lucide-react";
import { DashboardNavigation } from "@/components/dashboard-navigation";
import { apiFetch, type TrackSummary } from "@/lib/api";
import { CourseCarousel } from "@/components/course-carousel";
import { unlockedLearningCourses } from '@/lib/course-access';
import { courseButtonLabel } from '@/lib/course-status';
=======
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BookOpen, Clock3, LockKeyhole } from 'lucide-react'
import { DashboardNavigation } from '@/components/dashboard-navigation'
import { API_URL, TrackSummary } from '@/lib/api'
>>>>>>> origin/feature/caio-admin

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
<<<<<<< HEAD
    const controller = new AbortController();
    apiFetch("/trilhas", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Entre na sua conta para carregar as aulas.");
        setTracks(await response.json());
      })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Não foi possível carregar as aulas."); });
    return () => controller.abort();
  }, []);
=======
    fetch(`${API_URL}/trilhas`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Não foi possível carregar as trilhas.')
        setTracks(await response.json())
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Erro inesperado.'))
      .finally(() => setLoading(false))
  }, [])
>>>>>>> origin/feature/caio-admin

  return (
    <main className="app-shell dashboard-page">
      <DashboardNavigation active="aulas" />
      <section className="learning-paths content-wrap">
<<<<<<< HEAD
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
            </CourseCarousel>
          </section>
        ))}
      </section>
    </main>
  );
}
=======
        {loading && <p className="results-line">Carregando trilhas...</p>}
        {error && <p className="results-line">{error}</p>}
        {!loading && !error && levels.map((level) => {
          const levelTracks = tracks.filter((track) => track.nivel === level.key)
          return (
            <section className="learning-level" key={level.key} style={{ '--level-color': level.color } as React.CSSProperties}>
              <aside className="learning-level-intro">
                <div className="learning-level-title"><i /><h1>{level.title}</h1></div>
                <p>{level.description}</p>
              </aside>
              <div className="learning-level-cards">
                {levelTracks.length ? levelTracks.map((track) => (
                  <article key={track.id} className={`learning-path-card ${track.bloqueada ? 'is-locked' : ''}`} style={{ '--track-image': level.image } as React.CSSProperties}>
                    <div className="learning-path-image" />
                    <div className="learning-path-body">
                      <span className="learning-path-badge">{level.key === 'BASICO' ? 'INICIANTE' : level.key === 'INTERMEDIARIO' ? 'INTERMEDIÁRIO' : 'AVANÇADO'}</span>
                      <h2>{track.titulo}</h2>
                      <p>{track.descricao}</p>
                      <div className="learning-path-meta">
                        <span><BookOpen size={15} /> {track.totalAulas} aulas</span>
                        <span><Clock3 size={15} /> 2 horas</span>
                        <strong>{track.percentual}%</strong>
                      </div>
                      {track.bloqueada
                        ? <span className="learning-path-lock"><LockKeyhole size={14} /> Conclua as trilhas anteriores</span>
                        : <Link href={`/aulas/modulo/${track.id}`}>{track.percentual ? 'Continuar trilha' : 'Ver trilha'}</Link>}
                    </div>
                  </article>
                )) : <ComingSoon />}
              </div>
            </section>
          )
        })}
      </section>
    </main>
  )
}

function ComingSoon() {
  return (
    <article className="learning-path-card learning-path-soon">
      <div className="learning-path-image" />
      <div className="learning-path-body">
        <span>EM BREVE</span>
        <h2>Nova trilha</h2>
        <p>Novos conteúdos serão disponibilizados em breve.</p>
      </div>
    </article>
  )
}
>>>>>>> origin/feature/caio-admin
