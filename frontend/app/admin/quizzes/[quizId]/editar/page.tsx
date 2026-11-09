"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  listarQuizzesAdmin,
  listarAulas,
  atualizarQuizAdmin,
  adicionarQuestaoQuiz,
  adicionarAlternativaQuiz,
  type QuizAdmin,
  type AdminAula,
} from "@/lib/admin-api";

export default function EditarQuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const [quiz, setQuiz] = useState<QuizAdmin | null>(null),
    [aulas, setAulas] = useState<AdminAula[]>([]),
    [erro, setErro] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false);
  const carregar = useCallback(async () => {
    try {
      const [quizzes, lista] = await Promise.all([
        listarQuizzesAdmin(),
        listarAulas(),
      ]);
      const item = quizzes.find((q) => q.id === quizId);
      if (!item) throw new Error("Quiz não encontrado.");
      setQuiz(item);
      setAulas(lista);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao carregar.");
    } finally {
      setLoading(false);
    }
  }, [quizId]);
  useEffect(() => {
    void carregar();
  }, [carregar]);
  async function executar(action: () => Promise<unknown>) {
    setBusy(true);
    setErro("");
    try {
      await action();
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao salvar.");
    } finally {
      setBusy(false);
    }
  }
  function questao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!quiz) return;
    const form = event.currentTarget,
      data = new FormData(form);
    void executar(async () => {
      await adicionarQuestaoQuiz(quiz.id, {
        enunciado: String(data.get("enunciado")),
        explicacao: String(data.get("explicacao")),
        ordem: Math.max(0, ...quiz.questoes.map((q) => q.ordem)) + 1,
      });
      form.reset();
    });
  }
  function alternativa(
    event: FormEvent<HTMLFormElement>,
    item: QuizAdmin["questoes"][number],
  ) {
    event.preventDefault();
    if (!quiz) return;
    const form = event.currentTarget,
      data = new FormData(form);
    void executar(async () => {
      await adicionarAlternativaQuiz(quiz.id, item.id, {
        texto: String(data.get("texto")),
        correta: data.has("correta"),
        ordem: Math.max(0, ...item.alternativas.map((a) => a.ordem)) + 1,
      });
      form.reset();
    });
  }
  const campo =
    "my-2 block w-full rounded border border-slate-600 bg-slate-950 p-3 text-white";
  return (
    <section>
      <Link href="/admin/quizzes">Voltar aos quizzes</Link>
      <h1 className="my-4 text-3xl">Editar quiz</h1>
      {erro && <p role="alert">{erro}</p>}
      {loading && <p>Carregando…</p>}
      {quiz && (
        <fieldset disabled={busy || quiz.status !== "RASCUNHO"}>
          <p className="my-3">
            Status: {quiz.status}. Retorne a rascunho na listagem para editar.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void executar(() =>
                atualizarQuizAdmin(quiz.id, {
                  titulo: quiz.titulo,
                  descricao: quiz.descricao,
                  aulaId: quiz.aulaId,
                }),
              );
            }}
          >
            <label>
              Título
              <input
                className={campo}
                required
                maxLength={160}
                value={quiz.titulo}
                onChange={(e) => setQuiz({ ...quiz, titulo: e.target.value })}
              />
            </label>
            <label>
              Descrição
              <textarea
                className={campo}
                required
                maxLength={2000}
                value={quiz.descricao}
                onChange={(e) =>
                  setQuiz({ ...quiz, descricao: e.target.value })
                }
              />
            </label>
            <label>
              Aula
              <select
                className={campo}
                value={quiz.aulaId}
                onChange={(e) => setQuiz({ ...quiz, aulaId: e.target.value })}
              >
                {aulas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.titulo}
                  </option>
                ))}
              </select>
            </label>
            <button className="my-3 rounded bg-[#b2ff00] p-3 text-black">
              Salvar dados
            </button>
          </form>
          {quiz.questoes.map((item) => (
            <article
              key={item.id}
              className="my-5 rounded-xl border border-slate-700 p-4"
            >
              <h2>
                {item.ordem}. {item.enunciado}
              </h2>
              <p>{item.explicacao}</p>
              <ul>
                {item.alternativas.map((a) => (
                  <li key={a.id}>
                    {a.texto} {a.correta && "✓ Correta"}
                  </li>
                ))}
              </ul>
              <form onSubmit={(e) => alternativa(e, item)}>
                <label>
                  Nova alternativa
                  <input
                    name="texto"
                    className={campo}
                    required
                    maxLength={2000}
                  />
                </label>
                <label>
                  <input type="checkbox" name="correta" /> Correta
                </label>
                <button className="ml-4 rounded border p-2">
                  Adicionar alternativa
                </button>
              </form>
            </article>
          ))}
          <form
            onSubmit={questao}
            className="my-6 rounded-xl border border-slate-700 p-4"
          >
            <h2>Nova questão</h2>
            <label>
              Enunciado
              <textarea
                name="enunciado"
                className={campo}
                required
                maxLength={2000}
              />
            </label>
            <label>
              Explicação
              <textarea
                name="explicacao"
                className={campo}
                required
                maxLength={5000}
              />
            </label>
            <button className="rounded bg-[#b2ff00] p-3 text-black">
              Adicionar questão
            </button>
          </form>
        </fieldset>
      )}
    </section>
  );
}
