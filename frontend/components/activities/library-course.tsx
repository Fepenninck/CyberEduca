"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LessonLearningContent } from "./lesson-learning-content";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Play,
} from "lucide-react";
import { DashboardNavigation } from "@/components/dashboard-navigation";
import { LockKeyhole } from "lucide-react";
import { isLessonUnlocked } from "@/lib/lesson-access";
import { markCourseStarted } from "@/lib/course-status";
import {
  loadLearningAccess,
  unlockedLibraryCourses,
} from "@/lib/course-access";
import { findLibraryCourse } from "@/lib/course-library";

export function LibraryCourse({
  id,
  lessonId,
}: {
  id: string;
  lessonId?: string;
}) {
  const course = findLibraryCourse(id);
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(lessonId || "aula-1");
  const [done, setDone] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [storageError, setStorageError] = useState(false);
  const [ready, setReady] = useState(false);
  const [courseUnlocked, setCourseUnlocked] = useState(false);
  const [accessReady, setAccessReady] = useState(false);
  useEffect(() => {
    if (
      ready &&
      accessReady &&
      courseUnlocked &&
      course &&
      isLessonUnlocked(
        course.lessons.map((l) => l.id),
        done,
        selectedId,
      )
    )
      markCourseStarted(id, selectedId);
  }, [ready, accessReady, courseUnlocked, course, done, selectedId, id]);
  useEffect(() => {
    let active = true;
    setAccessReady(false);
    loadLearningAccess()
      .then((ids) => {
        if (active) setCourseUnlocked(ids.includes(id));
      })
      .catch(() => {
        if (active) {
          try {
            setCourseUnlocked(
              unlockedLibraryCourses((key) =>
                localStorage.getItem(key),
              ).includes(id),
            );
          } catch {
            setCourseUnlocked(false);
          }
        }
      })
      .finally(() => {
        if (active) setAccessReady(true);
      });
    return () => {
      active = false;
    };
  }, [id]);
  useEffect(() => {
    try {
      setCourseUnlocked(
        unlockedLibraryCourses((key) => localStorage.getItem(key)).includes(id),
      );
      const saved: unknown = JSON.parse(
        localStorage.getItem(`cybereduca-library-${id}`) || "[]",
      );
      if (Array.isArray(saved))
        setDone(
          saved.filter(
            (value): value is string =>
              typeof value === "string" &&
              !!course?.lessons.some((lesson) => lesson.id === value),
          ),
        );
    } catch {
      setStorageError(true);
    } finally {
      setReady(true);
    }
  }, [id, course]);
  const index =
    course?.lessons.findIndex((lesson) => lesson.id === selectedId) ?? -1;
  const lesson = course?.lessons[index];
  if (!course || !lesson)
    return (
      <main className="app-shell dashboard-page">
        <DashboardNavigation active="aulas" />
        <p className="content-wrap">
          Aula não encontrada. <Link href="/aulas">Voltar para trilhas</Link>
        </p>
      </main>
    );
  const activeCourse = course;
  const activeLesson = lesson;
  const completed = done.includes(lesson.id);
  const unlocked = (target: string) =>
    isLessonUnlocked(
      course.lessons.map((l) => l.id),
      done,
      target,
    );
  if (!ready || !accessReady)
    return (
      <main className="app-shell dashboard-page">
        <DashboardNavigation active="aulas" />
        <p className="content-wrap">Carregando progresso...</p>
      </main>
    );
  if (!courseUnlocked)
    return (
      <main className="app-shell dashboard-page">
        <DashboardNavigation active="aulas" />
        <article className="lesson-content mx-auto">
          <Link className="back-link" href="/aulas">
            <ArrowLeft size={16} /> Voltar para trilhas
          </Link>
          <h1>
            <LockKeyhole size={26} /> Trilha bloqueada
          </h1>
          <p>Conclua a trilha anterior para liberar estas aulas.</p>
        </article>
      </main>
    );
  if (!unlocked(lesson.id))
    return (
      <main className="app-shell dashboard-page">
        <DashboardNavigation active="aulas" />
        <article className="lesson-content mx-auto">
          <Link href={`/aulas/modulo/${id}`} className="back-link">
            <ArrowLeft size={16} /> Voltar para aulas
          </Link>
          <h1>
            <LockKeyhole size={26} /> Aula bloqueada
          </h1>
          <p>Conclua a aula anterior para liberar este conteúdo.</p>
          <Link
            className="complete-button"
            href={`/aulas/modulo/${id}/aula/${course.lessons[Math.max(0, index - 1)].id}`}
          >
            Ir para a aula anterior
          </Link>
        </article>
      </main>
    );
  const percent = Math.round((done.length / course.lessons.length) * 100);
  const trackNumber =
    course.level === "BASICO"
      ? "01"
      : course.level === "INTERMEDIARIO"
        ? "02"
        : "03";
  const localNotice = `Progresso desta biblioteca salvo somente neste navegador.${storageError ? " Armazenamento indisponível; a marcação vale apenas nesta sessão." : ""}`;
  function complete() {
    if (!unlocked(activeLesson.id)) return;
    const next = [...new Set([...done, activeLesson.id])];
    setDone(next);
    try {
      localStorage.setItem(`cybereduca-library-${id}`, JSON.stringify(next));
      window.dispatchEvent(new Event("course-progress-updated"));
    } catch {
      setStorageError(true);
    }
    const nextLesson = activeCourse.lessons[index + 1];
    if (!nextLesson) router.push("/aulas");
    else if (lessonId) router.push(`/aulas/modulo/${id}/aula/${nextLesson.id}`);
    else setSelectedId(nextLesson.id);
  }

  // A rota de uma aula usa o mesmo leitor original das aulas do servidor.
  if (lessonId)
    return (
      <main className="app-shell dashboard-page">
        <DashboardNavigation active="aulas" />
        <article className="lesson-content mx-auto">
          <Link href={`/aulas/modulo/${id}`} className="back-link">
            <ArrowLeft size={16} /> Voltar para aulas
          </Link>
          <div className="lesson-topline">
            <span>{course.title}</span>
            <span>Aula {String(index + 1).padStart(2, "0")}</span>
          </div>
          <div className="eyebrow">Aula</div>
          <h1>{lesson.title}</h1>
          <div className="lesson-meta">
            <span>
              <Clock3 size={16} /> Leitura e exercício
            </span>
          </div>
          <div className="lesson-divider" />
          <section className="prose-content">
            <LessonLearningContent
              key={lesson.id}
              lesson={lesson}
              courseId={id}
              showDiagram={index === 0 || index === course.lessons.length - 1}
            />
          </section>
          <div className="lesson-actions">
            <button
              className={`complete-button ${completed ? "is-done" : ""}`}
              onClick={complete}
            >
              {completed ? (
                <>
                  <Check size={18} /> Aula concluída
                </>
              ) : (
                "Marcar como concluída"
              )}
            </button>
            <nav
              className="lesson-nav-buttons"
              aria-label="Navegação entre aulas"
            >
              {index > 0 && (
                <Link
                  href={`/aulas/modulo/${id}/aula/${course.lessons[index - 1].id}`}
                >
                  <ArrowLeft size={16} /> Anterior
                </Link>
              )}
              {course.lessons[index + 1] && completed && (
                <Link
                  href={`/aulas/modulo/${id}/aula/${course.lessons[index + 1].id}`}
                >
                  Próxima aula <ArrowRight size={16} />
                </Link>
              )}
            </nav>
          </div>
          <p className="results-line">{localNotice}</p>
        </article>
      </main>
    );

  // A página do módulo preserva a grade original: lista, conteúdo e progresso.
  return (
    <main className="app-shell dashboard-page">
      <DashboardNavigation active="aulas" />
      <section className="track-detail-hero track-detail-hero-no-image">
        <div className="content-wrap">
          <Link href="/aulas" className="back-link">
            <ArrowLeft size={16} /> Voltar para trilhas
          </Link>
          <div className="detail-grid">
            <div>
              <span
                className={`eyebrow track-number track-number-${trackNumber}`}
              >
                Trilha {trackNumber}
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <h1>{course.title}</h1>
              </div>
              <p>{course.description}</p>
              <div className="detail-stats">
                <div>
                  <strong>{course.lessons.length}</strong>
                  <span>Aulas</span>
                </div>
                <div>
                  <strong>Leitura</strong>
                  <span>Formato</span>
                </div>
                <div>
                  <strong>1</strong>
                  <span>Módulo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="content-wrap curriculum track-learning">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Conteúdo</span>
            <h2>Conteúdos da trilha</h2>
          </div>
        </div>
        <div className="track-learning-grid">
          <aside className="track-module-navigation">
            <button
              type="button"
              className={expanded ? "is-active" : ""}
              onClick={() => setExpanded((value) => !value)}
              aria-expanded={expanded}
            >
              <span className="module-play-icon">
                <Play size={14} fill="currentColor" />
              </span>
              <span>
                <small>Módulo 01</small>
                <strong>Conteúdos da trilha</strong>
                <em>{course.lessons.length} aulas · leitura e exercícios</em>
              </span>
              <ChevronDown
                size={18}
                className={expanded ? "is-expanded" : ""}
              />
            </button>
            {expanded && (
              <div className="track-module-lessons">
                {course.lessons.map((item, i) => (
                  <button
                    type="button"
                    className={`${item.id === selectedId ? "is-selected " : ""}${done.includes(item.id) ? "is-completed" : ""}`}
                    disabled={!unlocked(item.id)}
                    title={
                      !unlocked(item.id)
                        ? "Conclua a aula anterior para liberar"
                        : undefined
                    }
                    onClick={() => {
                      if (unlocked(item.id)) setSelectedId(item.id);
                    }}
                    key={item.id}
                  >
                    <span>
                      {!unlocked(item.id) ? (
                        <LockKeyhole size={14} />
                      ) : done.includes(item.id) ? (
                        <Check size={14} />
                      ) : (
                        <Clock3 size={14} />
                      )}
                    </span>
                    <p>
                      <small>Aula {String(i + 1).padStart(2, "0")}</small>
                      <strong>{item.title}</strong>
                    </p>
                  </button>
                ))}
              </div>
            )}
          </aside>
          <article className="track-lesson-viewer">
            <div className="track-lesson-viewer-heading">
              <span>Aula {String(index + 1).padStart(2, "0")}</span>
              <h3>{lesson.title}</h3>
              <p>Confira o conteúdo e avance no seu ritmo.</p>
            </div>
            <div className="track-lesson-content">
              <LessonLearningContent
                key={lesson.id}
                lesson={lesson}
                courseId={id}
                showDiagram={index === 0 || index === course.lessons.length - 1}
              />
            </div>
          </article>
          <aside className="track-learning-aside">
            <article className="track-progress-summary">
              <div>
                <strong>Seu progresso na trilha</strong>
                <b>{percent}%</b>
              </div>
              <div className="dashboard-progress-bar">
                <span style={{ width: `${percent}%` }} />
              </div>
              <p>
                {done.length} de {course.lessons.length} aulas concluídas
              </p>
              <p>{localNotice}</p>
            </article>
            <article className="track-next-lesson">
              <span>Aula atual</span>
              <div>
                <span className="track-next-icon">
                  <Play size={16} fill="currentColor" />
                </span>
                <p>
                  <small>Aula {String(index + 1).padStart(2, "0")}</small>
                  <strong>{lesson.title}</strong>
                </p>
              </div>
              <button
                type="button"
                className={completed ? "is-completed" : ""}
                onClick={complete}
              >
                <Check size={16} />{" "}
                {completed ? "Aula concluída" : "Marcar como concluída"}
              </button>
            </article>
          </aside>
        </div>
      </section>
    </main>
  );
}
