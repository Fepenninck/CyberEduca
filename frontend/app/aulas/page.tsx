"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { BookOpen, Check, LockKeyhole } from "lucide-react";
import { DashboardNavigation } from "@/components/dashboard-navigation";
import { apiFetch, type TrackSummary } from "@/lib/api";
import { LearningTrail } from "@/components/learning-trail";
import { unlockedLearningCourses } from '@/lib/course-access';
import { courseButtonLabel } from '@/lib/course-status';
import courseImages from '@/lib/course-images.json';
import { TrailAchievement, useAchievements } from '@/components/level-achievements';
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
  const achievements = useAchievements();
  const [tracks, setTracks] = useState<TrackSummary[]>([]);
  const visibleTracks = tracks.filter(track => track.totalAulas > 0 && track.id !== '4328594b-f7cb-52d2-862f-e612b1647aa9');
  const images: Record<string, { src: string; alt: string; source: string }> = courseImages;
  const unlocked = unlockedLearningCourses(tracks);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const load = () => apiFetch("/trilhas", { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error("Entre na sua conta para carregar as aulas.");
        setTracks(await response.json());
      })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Não foi possível carregar as aulas."); });
    void load();
    window.addEventListener('focus', load);
    window.addEventListener('learning-progress-updated', load);
    return () => { controller.abort(); window.removeEventListener('focus', load); window.removeEventListener('learning-progress-updated', load); };
  }, []);

  return (
    <main className="app-shell dashboard-page learning-paths-page">
      <DashboardNavigation active="aulas" />
      <section className="learning-paths content-wrap">
        <header className="paths-hero paths-heading">
          <div>
            <span className="paths-heading-eyebrow">Seu percurso de aprendizagem</span>
            <h1>Trilhas de aprendizagem</h1>
            <p>Aprenda no seu ritmo. Conclua um nível para desbloquear o próximo.</p>
          </div>
          <ol className="paths-journey" aria-label="Progresso por nível">
            {levels.map(level => {
              const group = visibleTracks.filter(track => track.nivel === level.key);
              const progress = group.length ? Math.round(group.reduce((sum, track) => sum + track.percentual, 0) / group.length) : 0;
              return <li key={level.key} className={progress === 100 ? 'is-done' : progress > 0 ? 'is-active' : undefined} style={{ '--level-color': level.color } as CSSProperties}>
                <div className="paths-level-label"><strong>{level.key === 'BASICO' ? 'Básico' : level.title.replace('Nível ', '')}</strong><small>{progress}%</small></div>
                <div className="paths-level-meter" role="progressbar" aria-label={`Progresso no ${level.title}`} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress}%` }} /></div>
                <span className="paths-level-count">{group.filter(track => track.percentual === 100).length}/{group.length} trilhas concluídas</span>
              </li>;
            })}
          </ol>

        </header>
        {error && <p role="alert">{error}</p>}
        <LearningTrail label="Iniciante ao avançado">
          {levels.flatMap(level => [...visibleTracks.filter(track => track.nivel === level.key).map(track => (
                  <article
                    key={track.id}
                    data-level={level.key}
                    className={`learning-path-card ${!unlocked.includes(track.id) ? "is-locked" : ""} ${track.percentual === 100 ? "is-done" : ""}`}
                    style={{ "--track-image": level.image, "--level-color": level.color } as CSSProperties}
                  >
                    <div className="learning-path-image">
                      {images[track.id] && <img src={images[track.id].src} alt={images[track.id].alt} loading="lazy" width={900} height={500} />}
                    </div>
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
          )), <TrailAchievement key={`badge-${level.key}`} level={level.key} progress={achievements.data.find(item => item.nivel === level.key)} unavailable={achievements.error} />])}
        </LearningTrail>
      </section>
    </main>
  );
}
