"use client";
import { parseLessonMaterial } from "@/lib/lesson-material";
import { LessonLearningContent } from "@/components/activities/lesson-learning-content";


import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Check, Clock3 } from "lucide-react";
import { DashboardNavigation } from "@/components/dashboard-navigation";
import { API_URL } from "@/lib/api";
import type { TrackDetail } from "@/lib/api";
import { isLessonUnlocked } from "@/lib/lesson-access";
import { loadLearningAccess } from '@/lib/course-access';

type NavigationLesson = { id: string; titulo: string; ordem: number } | null;
type Lesson = {
  id: string;
  titulo: string;
  conteudo: string;
  ordem: number;
  concluida: boolean;
  trilha: { id: string; titulo: string };
  anterior: NavigationLesson;
  proxima: NavigationLesson;
};

const YOUTUBE_IFRAME_PATTERN =
  /<iframe\b[^>]*\bsrc=["'](https:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/[\w-]+(?:\?[^"']*)?)["'][^>]*><\/iframe>\s*/gi;

function extractYoutubeEmbeds(conteudo: string) {
  const videos: string[] = [];
  const markdown = conteudo.replace(
    YOUTUBE_IFRAME_PATTERN,
    (_, src: string) => {
      videos.push(src);
      return "";
    },
  );

  return { markdown, videos };
}

export function LessonStudy({
  lessonId,
  moduleId,
}: {
  lessonId: string;
  moduleId?: string;
}) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLesson() {
      setLoading(true);
      setLesson(null);
      setError("");
      try {
        const response = await fetch(API_URL + "/aulas/" + lessonId);
        if (!response.ok) throw new Error("Não foi possível carregar a aula.");
        const loaded: Lesson = await response.json();
        const unlocked = await loadLearningAccess();
        if (!unlocked.includes(loaded.trilha.id)) throw new Error('Conclua a trilha anterior para liberar este conteúdo.');
        const trackResponse = await fetch(
          `${API_URL}/trilhas/${loaded.trilha.id}`,
          { cache: "no-store" },
        );
        if (!trackResponse.ok)
          throw new Error("Não foi possível verificar o progresso da trilha.");
        const track: TrackDetail = await trackResponse.json();
        if (
          !isLessonUnlocked(
            track.aulas.map((l) => l.id),
            track.aulas.filter((l) => l.concluida).map((l) => l.id),
            loaded.id,
          )
        )
          throw new Error(
            "Aula bloqueada. Conclua a aula anterior para liberar este conteúdo.",
          );
        setLesson(loaded);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Erro inesperado.");
      } finally {
        setLoading(false);
      }
    }
    loadLesson();
  }, [lessonId]);

  async function completeLesson() {
    if (!lesson || saving) return;
    const advance = () => router.push(lesson.proxima ? `/aulas/modulo/${lesson.trilha.id}/aula/${lesson.proxima.id}` : '/aulas');
    if (lesson.concluida) { advance(); return; }
    setSaving(true);
    try {
      const response = await fetch(
        API_URL + "/aulas/" + lesson.id + "/concluir",
        { method: "POST" },
      );
      if (!response.ok) throw new Error("Não foi possível salvar a conclusão.");
      setLesson({ ...lesson, concluida: true });
      advance();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro inesperado.");
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <main className="app-shell dashboard-page">
        <DashboardNavigation active="aulas" />
        <p className="content-wrap">Carregando aula...</p>
      </main>
    );
  if (error || !lesson)
    return (
      <main className="app-shell dashboard-page">
        <DashboardNavigation active="aulas" />
        <p className="content-wrap">{error || "Aula não encontrada."}</p>
      </main>
    );
  const { markdown, videos } = extractYoutubeEmbeds(lesson.conteudo);

  return (
    <main className="app-shell dashboard-page">
      <DashboardNavigation active="aulas" />
      <article className="lesson-content mx-auto">
        <Link
          href={moduleId ? `/aulas/modulo/${moduleId}` : "/aulas"}
          className="back-link"
        >
          <ArrowLeft size={16} /> Voltar para aulas
        </Link>
        <div className="lesson-topline">
          <span>{lesson.trilha.titulo}</span>
          <span>Aula {String(lesson.ordem).padStart(2, "0")}</span>
        </div>
        <h1>{lesson.titulo}</h1>
        <div className="lesson-meta">
          <span>
            <Clock3 size={16} /> Duração a definir
          </span>
        </div>
        <div className="lesson-divider" />
        <section className="prose-content">
          {videos.map((src) => (
            <div
              key={src}
              className="my-8 overflow-hidden rounded-md border border-[#29384d]"
              style={{ aspectRatio: "16 / 9" }}
            >
              <iframe
                src={src}
                title={`Vídeo da aula: ${lesson.titulo}`}
                className="block h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          ))}
{parseLessonMaterial(lesson.conteudo) ? <LessonLearningContent key={lesson.id} lesson={parseLessonMaterial(lesson.conteudo)!} aulaId={lesson.id} showDiagram /> : (
          <ReactMarkdown
            components={{
              img: ({ src, alt }) => (
                <img
                  src={src}
                  alt={alt ?? ""}
                  className="my-8 w-full rounded-md border border-[#29384d]"
                />
              ),
            }}
          >
            {markdown ||
              "Este conteúdo ainda está em branco. Escreva a sua aula no banco de dados."}
          </ReactMarkdown>
)}
        </section>
        <div className="lesson-actions">
          <button
            className={"complete-button " + (lesson.concluida ? "is-done" : "")}
            onClick={completeLesson}
            disabled={saving}
          >
            {lesson.concluida ? (
              <>
                <Check size={18} /> Aula concluída
              </>
            ) : saving ? (
              "Salvando..."
            ) : (
              "Marcar como concluída"
            )}
          </button>
          <nav
            className="lesson-nav-buttons"
            aria-label="Navegação entre aulas"
          >
            {lesson.anterior && (
              <Link
                href={
                  moduleId
                    ? `/aulas/modulo/${moduleId}/aula/${lesson.anterior.id}`
                    : "/aulas/" + lesson.anterior.id
                }
              >
                <ArrowLeft size={16} /> Anterior
              </Link>
            )}
            {lesson.proxima && lesson.concluida && (
              <Link
                href={
                  moduleId
                    ? `/aulas/modulo/${moduleId}/aula/${lesson.proxima.id}`
                    : "/aulas/" + lesson.proxima.id
                }
              >
                Próxima aula
              </Link>
            )}
          </nav>
        </div>
      </article>
    </main>
  );
}
