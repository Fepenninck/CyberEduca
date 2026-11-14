"use client";
import { LoadingScreen } from '@/components/ui/loading-screen'
import { parseLessonMaterial } from "@/lib/lesson-material";
import { LessonLearningContent } from "@/components/activities/lesson-learning-content";


import Link from "next/link";
import { useRouter } from 'next/navigation';
import { use, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Check, ChevronDown, Clock3, Play } from "lucide-react";
import { apiFetch, type TrackDetail } from "@/lib/api";
import { UserMenu } from "@/components/user-menu";
import { DashboardNavigation } from "@/components/dashboard-navigation";
import { LockKeyhole } from "lucide-react";
import { isLessonUnlocked } from "@/lib/lesson-access";
import { loadLearningAccess } from '@/lib/course-access';

type LessonContent = {
  id: string;
  titulo: string;
  conteudo: string;
  ordem: number;
  concluida: boolean;
};
const youtubePattern =
  /<iframe\b[^>]*\bsrc=["'](https:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/[\w-]+(?:\?[^"']*)?)["'][^>]*><\/iframe>\s*/gi;

const welcomeLessonId = 'b1a2c3d4-1111-2222-3333-444444444441';
const welcomeVideoSource = '/videos/boas-vindas-cybereduca.mp4';

function splitLessonContent(content: string, lessonId: string) {
  const videos: string[] = [];
  const markdown = content.replace(youtubePattern, (_, source: string) => {
    videos.push(source);
    return "";
  });

  return {
    markdown,
    videos: lessonId === welcomeLessonId
      ? [welcomeVideoSource, ...videos.filter(source => !/\/embed\/doFxojMJwLc(?:\?|$)/.test(source))]
      : videos,
  };
}

function TrackModulePage({ params }: { params: Promise<{ slug: string; lesson?: string }> }) {
  const { slug, lesson: initialLessonId } = use(params);
  const router = useRouter();
  const [track, setTrack] = useState<TrackDetail | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<LessonContent | null>(
    null,
  );
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [savingCompletion, setSavingCompletion] = useState(false);
  const [error, setError] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const lessonRequest = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    lessonRequest.current += 1;
    setError("");
    setTrack(null);
    setSelectedLesson(null);
      apiFetch(`/trilhas/${slug}`, { cache: 'no-store', signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error("Trilha não encontrada.");
          const loadedTrack: TrackDetail = await response.json();
          const unlocked = await loadLearningAccess();
          if (!unlocked.includes(loadedTrack.id)) throw new Error('Conclua a trilha anterior para liberar este conteúdo.');
          if (controller.signal.aborted) return;
          setTrack(loadedTrack);
          setSelectedLesson(null);
        })
        .catch((cause) => {
          if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Erro inesperado.");
        });
    return () => { controller.abort(); lessonRequest.current += 1; };
  }, [slug, initialLessonId]);

  async function selectLesson(lessonId: string, progressTrack = track) {
    if (
      !progressTrack ||
      !isLessonUnlocked(
        progressTrack.aulas.map((l) => l.id),
        progressTrack.aulas.filter((l) => l.concluida).map((l) => l.id),
        lessonId,
      )
    ) {
      setError('Conclua as aulas anteriores para liberar esta aula.');
      return;
    }
    const requestId = ++lessonRequest.current;
    setLoadingLesson(true);
    setError("");
    try {
      const response = await apiFetch(`/aulas/${lessonId}`, { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(typeof body.message === 'string' ? body.message : "Não foi possível carregar a aula.");
      if (requestId === lessonRequest.current) setSelectedLesson(body);
    } catch (cause) {
      if (requestId === lessonRequest.current) setError(cause instanceof Error ? cause.message : "Erro inesperado.");
    } finally {
      if (requestId === lessonRequest.current) setLoadingLesson(false);
    }
  }

  async function completeLesson() {
    if (!displayedLesson || !track || savingCompletion || loadingLesson) return;
    const nextLesson = track.aulas[track.aulas.findIndex(l => l.id === displayedLesson.id) + 1];
    if (displayedLesson.concluida) {
      if (nextLesson) router.push(`/aulas/modulo/${track.id}/aula/${nextLesson.id}`);
      else router.push('/aulas');
      return;
    }
    setSavingCompletion(true);
    setError("");
    try {
      const response = await apiFetch(
        `/aulas/${displayedLesson.id}/concluir`,
        { method: "POST" },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(typeof result.message === 'string' ? result.message : "Não foi possível confirmar a aula.");
      setSelectedLesson((lesson) =>
        lesson ? { ...lesson, concluida: true } : lesson,
      );
      setTrack((current) =>
        current
          ? {
              ...current,
              percentual: result.percentualTrilha,
              aulas: current.aulas.map((lesson) =>
                lesson.id === displayedLesson.id
                  ? { ...lesson, concluida: true }
                  : lesson,
              ),
            }
          : current,
      );
      if (nextLesson) router.push(`/aulas/modulo/${track.id}/aula/${nextLesson.id}`);
      else router.push('/aulas');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro inesperado.");
    } finally {
      setSavingCompletion(false);
    }
  }

  useEffect(() => {
    if (!track || selectedLesson) return;
    const firstLesson =
      track.aulas.find((lesson) => lesson.id === initialLessonId) ??
      track.aulas.find((lesson) => !lesson.concluida) ?? track.aulas[0];
    if (firstLesson) selectLesson(firstLesson.id);
  }, [track, selectedLesson, initialLessonId]);

  if (error && !track)
    return (
      <main className="app-shell dashboard-page track-module-page">
        <DashboardHeader />
        <p className="content-wrap">{error}</p>
      </main>
    );
  if (!track)
    return (
      <main className="app-shell dashboard-page track-module-page">
        <DashboardHeader />
        <LoadingScreen label={"Carregando trilha..."} />
      </main>
    );

  const completedLessons = track.aulas.filter(
    (lesson) => lesson.concluida,
  ).length;
  const initialLesson =
    track.aulas.find((lesson) => !lesson.concluida) ?? track.aulas[0];
  const activeLessonId = selectedLesson?.id ?? initialLesson?.id;
  const displayedLesson = selectedLesson ?? initialLesson;
  const lessonBody = selectedLesson
    ? splitLessonContent(selectedLesson.conteudo, selectedLesson.id)
    : null;
  const trackNumber =
    track.nivel === "BASICO"
      ? "01"
      : track.nivel === "INTERMEDIARIO"
        ? "02"
        : "03";

  return (
    <main className="app-shell dashboard-page track-module-page">
      <DashboardHeader />
      <section className="content-wrap curriculum track-learning">
        {error && <p role="alert" className="mb-5 rounded-lg border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</p>}
        <div className="section-heading">
          <div>
            <h2>Conteúdos da trilha</h2>
          </div>
        </div>
        <div className="track-learning-grid">
          <aside className="track-module-navigation">
            <button
              type="button"
              className={isExpanded ? "is-active" : ""}
              onClick={() => setIsExpanded((expanded) => !expanded)}
              aria-expanded={isExpanded}
            >
              <span className="module-play-icon">
                <Play size={14} fill="currentColor" />
              </span>
              <span>
                <small>Módulo 01</small>
                <strong>Conteúdos da trilha</strong>
                <em>{track.aulas.length} aulas em 2 horas</em>
              </span>
              <ChevronDown
                size={18}
                className={isExpanded ? "is-expanded" : ""}
              />
            </button>
            {isExpanded && (
              <div className="track-module-lessons">
                {track.aulas.map((lesson) => (
                  <button
                    type="button"
                    className={`${lesson.id === activeLessonId ? "is-selected " : ""}${lesson.concluida ? "is-completed" : ""}`}
                    onClick={() => selectLesson(lesson.id)}
                    disabled={savingCompletion || loadingLesson ||
                      !isLessonUnlocked(
                        track.aulas.map((l) => l.id),
                        track.aulas.filter((l) => l.concluida).map((l) => l.id),
                        lesson.id,
                      )
                    }
                    title={
                      !isLessonUnlocked(
                        track.aulas.map((l) => l.id),
                        track.aulas.filter((l) => l.concluida).map((l) => l.id),
                        lesson.id,
                      )
                        ? "Conclua a aula anterior para liberar"
                        : undefined
                    }
                    key={lesson.id}
                  >
                    <span>
                      {!isLessonUnlocked(
                        track.aulas.map((l) => l.id),
                        track.aulas.filter((l) => l.concluida).map((l) => l.id),
                        lesson.id,
                      ) ? (
                        <LockKeyhole size={14} />
                      ) : lesson.concluida ? (
                        <Check size={14} />
                      ) : (
                        <Clock3 size={14} />
                      )}
                    </span>
                    <p>
                      <small>
                        Aula {String(lesson.ordem).padStart(2, "0")}
                      </small>
                      <strong>{lesson.titulo}</strong>
                    </p>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <article className="track-lesson-viewer">
            {displayedLesson ? (
              <>
                <div className="track-lesson-viewer-heading">
                  <span>
                    Aula {String(displayedLesson.ordem).padStart(2, "0")}
                  </span>
                  <h3>{displayedLesson.titulo}</h3>
                  <p>
                    {loadingLesson
                      ? "Carregando conteúdo da aula..."
                      : "Confira o conteúdo e avance no seu ritmo."}
                  </p>
                </div>
                {loadingLesson ? (
                  <LoadingScreen label={"Carregando aula..."} />
                ) : lessonBody ? (
                  <div className="track-lesson-content">
                    {lessonBody.videos.map((source) => (
                      <div className={`track-video${source === welcomeVideoSource ? ' track-video-native' : ''}`} key={source}>
                        {source === welcomeVideoSource ? (
                          <video controls playsInline preload="metadata" aria-label={`Vídeo da aula: ${selectedLesson?.titulo ?? ''}`}>
                            <source src={source} type="video/mp4" />
                            Seu navegador não oferece suporte a este vídeo. <a href={source}>Abrir arquivo de vídeo</a>.
                          </video>
                        ) : (
                        <iframe
                          src={source}
                          title={`Vídeo da aula: ${selectedLesson?.titulo ?? ""}`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                        )}
                      </div>
                    ))}
{parseLessonMaterial(selectedLesson!.conteudo) ? <LessonLearningContent key={selectedLesson!.id} lesson={parseLessonMaterial(selectedLesson!.conteudo)!} aulaId={selectedLesson!.id} showDiagram /> : (
                    <ReactMarkdown
                      components={{
                        img: ({ src, alt }) => (
                          <img src={src} alt={alt ?? ""} />
                        ),
                      }}
                    >
                      {lessonBody.markdown ||
                        "Este conteúdo ainda está em preparação."}
                    </ReactMarkdown>
)}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="track-lesson-preview"
                    onClick={() => selectLesson(displayedLesson.id)}
                  >
                    <span>
                      <Play size={26} fill="currentColor" />
                    </span>
                    <strong>Carregar conteúdo da aula</strong>
                  </button>
                )}
              </>
            ) : (
              <div className="track-lesson-loading">
                Nenhuma aula disponível.
              </div>
            )}
          </article>

          <aside className="track-learning-aside">
            <article className="track-info-summary">
              <Link href="/aulas" className="track-return-link">
                <ArrowLeft size={18} aria-hidden="true" /> Voltar para trilhas
              </Link>
            <div className="track-header-copy">
              <span
                className={`eyebrow track-number track-number-${trackNumber}`}
              >
                Trilha {Number(trackNumber)}
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <h1>{track.titulo}</h1>
              </div>
              <p>{track.descricao}</p>
            </div>
            <div className="detail-stats">
              <div>
                <strong>{track.aulas.length}</strong>
                <span>Aulas</span>
              </div>
              <div>
                <strong>2 horas</strong>
                <span>Duração</span>
              </div>
              <div>
                <strong>1</strong>
                <span>Módulo</span>
              </div>
            </div>

            </article>
            <article className="track-progress-summary">
              <div>
                <strong>Seu progresso na trilha</strong>
                <b>{track.percentual}%</b>
              </div>
              <div className="dashboard-progress-bar">
                <span style={{ width: `${track.percentual}%` }} />
              </div>
              <p>
                {completedLessons} de {track.aulas.length} aulas concluídas
              </p>
            </article>
            {displayedLesson && (
              <article className="track-next-lesson">
                <span>Aula atual</span>
                <div>
                  <span className="track-next-icon">
                    <Play size={16} fill="currentColor" />
                  </span>
                  <p>
                    <small>
                      Aula {String(displayedLesson.ordem).padStart(2, "0")}
                    </small>
                    <strong>{displayedLesson.titulo}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  className={displayedLesson.concluida ? "is-completed" : ""}
                  onClick={completeLesson}
                  disabled={savingCompletion || loadingLesson}
                >
                  {displayedLesson.concluida ? (
                    <>
                      {track.aulas[track.aulas.findIndex(lesson => lesson.id === displayedLesson.id) + 1] ? 'Próxima aula' : 'Voltar às trilhas'}
                    </>
                  ) : savingCompletion ? (
                    "Confirmando..."
                  ) : (
                    <>
                      <Check size={16} /> Marcar como concluída
                    </>
                  )}
                </button>
              </article>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}

function DashboardHeader() {
  return <DashboardNavigation active="aulas" />;
}

export default TrackModulePage;
