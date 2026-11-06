"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { BookOpen, LockKeyhole } from "lucide-react";
import { DashboardNavigation } from "@/components/dashboard-navigation";
import { apiFetch, type TrackSummary } from "@/lib/api";
import { libraryCourses } from "@/lib/course-library";
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
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<Record<string, { percent: number; started: boolean }>>({});
  useEffect(() => {
    const refresh = () => { try {
      setUnlocked(unlockedLearningCourses(tracks, key => localStorage.getItem(key)));
      const next: Record<string, { percent: number; started: boolean }> = {};
      for (const track of tracks) next[track.id] = { percent: track.percentual, started: !!localStorage.getItem(`cybereduca-started-${track.id}`) };
      for (const course of libraryCourses) {
        let done: unknown = []; try { done = JSON.parse(localStorage.getItem(`cybereduca-library-${course.id}`) || '[]') } catch { /* Sem progresso válido. */ }
        const completed = Array.isArray(done) ? course.lessons.filter(l => done.includes(l.id)).length : 0;
        next[course.id] = { percent: Math.round(completed / course.lessons.length * 100), started: !!localStorage.getItem(`cybereduca-started-${course.id}`) };
      }
      setStatuses(next);
    } catch { setUnlocked([]) } };
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', refresh);
    window.addEventListener('course-progress-updated', refresh);
    return () => { window.removeEventListener('focus', refresh); window.removeEventListener('storage', refresh); window.removeEventListener('course-progress-updated', refresh); };
  }, [tracks]);
  useEffect(() => {
    const controller = new AbortController();
    apiFetch("/trilhas", { signal: controller.signal })
      .then(async (response) => {
        if (response.ok) setTracks(await response.json());
      })
      .catch(() => {
        /* A biblioteca permanece disponível independentemente da sessão. */
      });
    return () => controller.abort();
  }, []);

  return (
    <main className="app-shell dashboard-page">
      <DashboardNavigation active="aulas" />
      <section className="learning-paths content-wrap">
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
                          {courseButtonLabel(track.percentual, statuses[track.id]?.started || false)}
                        </Link>
                      )}
                    </div>
                  </article>
                ))}
              {libraryCourses
                .filter((course) => course.level === level.key)
                .map((course) => (
                  <article
                    className={`learning-path-card ${unlocked.includes(course.id) ? '' : 'is-locked'}`}
                    key={course.id}
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
                      <h2>{course.title}</h2>
                      <p>{course.description}</p>
                      <div className="learning-path-meta">
                        <span>
                          <BookOpen size={15} /> {course.lessons.length} aulas
                        </span>
                        <span>Biblioteca</span>
                        <strong>{statuses[course.id]?.percent || 0}%</strong>
                      </div>
                      {unlocked.includes(course.id) ? <Link href={`/aulas/modulo/${course.id}`}>{courseButtonLabel(statuses[course.id]?.percent || 0, statuses[course.id]?.started || false)}</Link> : <span className="learning-path-lock"><LockKeyhole size={14} /> Conclua a trilha anterior</span>}
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
