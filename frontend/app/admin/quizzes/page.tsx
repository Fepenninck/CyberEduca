"use client";

import Link from "next/link";
import {
  AdminListToolbar,
  AdminPagination,
  FILTROS_PUBLICACAO,
  useAdminCollection,
} from "@/components/admin/list-toolbar";
import { useEffect, useState } from "react";
import {
  alterarStatusQuiz,
  excluirQuiz,
  listarQuizzesAdmin,
  type QuizAdmin,
  type StatusPublicacao,
} from "@/lib/admin-api";

const statusPossiveis: StatusPublicacao[] = [
  "RASCUNHO",
  "PUBLICADO",
  "ARQUIVADO",
];

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [quizAtualizando, setQuizAtualizando] = useState<string | null>(null);
  const [atualizacao, setAtualizacao] = useState(0);

  const {
    busca,
    setBusca,
    filtrados,
    visiveis,
    pagina,
    totalPaginas,
    inicio,
    fim,
    irParaPagina,
    filtro,
    setFiltro,
  } = useAdminCollection(
    quizzes,
    (item) => [item.titulo, item.descricao, item.status].join(" "),
    (item) => (item.status === "PUBLICADO" ? "ATIVAS" : "INATIVAS"),
  );

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro(null);

    listarQuizzesAdmin()
      .then((dados) => {
        if (ativo) setQuizzes(dados);
      })
      .catch((erroBusca: unknown) => {
        if (ativo)
          setErro(
            erroBusca instanceof Error
              ? erroBusca.message
              : "Não foi possível carregar os quizzes.",
          );
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [atualizacao]);

  async function mudarStatus(quiz: QuizAdmin, status: StatusPublicacao) {
    if (status === quiz.status) return;
    setQuizAtualizando(quiz.id);
    setErro(null);

    try {
      await alterarStatusQuiz(quiz.id, status);
      setQuizzes((lista) =>
        lista.map((item) => (item.id === quiz.id ? { ...item, status } : item)),
      );
    } catch (erroStatus) {
      setErro(
        erroStatus instanceof Error
          ? erroStatus.message
          : "Não foi possível alterar o status do quiz.",
      );
    } finally {
      setQuizAtualizando(null);
    }
  }

  async function removerQuiz(quiz: QuizAdmin) {
    if (!window.confirm("Tem certeza que deseja excluir?")) return;
    setErro(null);
    try {
      await excluirQuiz(quiz.id);
      setAtualizacao((valor) => valor + 1);
    } catch (erroExclusao) {
      setErro(
        erroExclusao instanceof Error
          ? erroExclusao.message
          : "Não foi possível excluir o quiz.",
      );
    }
  }

  return (
    <section>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1768bd]">
            Avaliações
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#242a33]">
            Quizzes
          </h2>
          <p className="mt-2 text-sm text-[#626c79]">
            Gerencie as avaliações vinculadas às aulas.
          </p>
        </div>
        <Link
          href="/admin/quizzes/novo"
          className="inline-flex items-center gap-2 rounded-lg bg-[#1768bd] px-4 py-2.5 text-sm font-semibold text-[#ffffff] transition hover:bg-[#12569d]"
        >
          Novo Quiz
        </Link>
      </div>

      <AdminListToolbar
        busca={busca}
        onBusca={setBusca}
        total={quizzes.length}
        exibidos={filtrados.length}
        filtro={filtro}
        onFiltro={setFiltro}
        opcoes={FILTROS_PUBLICACAO}
      />
      {(busca || filtro !== "TODOS") && !filtrados.length && !carregando && (
        <p role="status" className="admin-empty-state">
          Nenhum registro corresponde aos filtros selecionados.
        </p>
      )}
      {erro && (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-700"
        >
          {erro}
        </p>
      )}

      {carregando ? (
        <div className="grid gap-4 md:grid-cols-2">
          <p role="status" className="text-sm text-[#626c79]">
            Carregando...
          </p>
        </div>
      ) : quizzes.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {visiveis.map((quiz) => {
            return (
              <article
                key={quiz.id}
                className="rounded-2xl border border-[#dce1e8] bg-[#ffffff] p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-[#242a33]">
                      {quiz.titulo}
                    </h3>
                    <Link
                      className="admin-text-link"
                      href={`/admin/quizzes/${encodeURIComponent(quiz.id)}/editar`}
                    >
                      Questões e detalhes
                    </Link>
                    <p className="mt-1 line-clamp-3 text-sm leading-5 text-[#626c79]">
                      {quiz.descricao}
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#e7ebf0] pt-4">
                  <span className="text-xs text-slate-500">
                    Aula: {quiz.aulaId}
                  </span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-[#626c79]">
                      Status
                      <select
                        aria-label={`Status do quiz ${quiz.titulo}`}
                        value={quiz.status}
                        disabled={quizAtualizando === quiz.id}
                        onChange={(event) =>
                          void mudarStatus(
                            quiz,
                            event.target.value as StatusPublicacao,
                          )
                        }
                        className="rounded-md border border-[#d4dce6] bg-[#f5f7fa] px-2 py-1.5 text-xs text-[#242a33] outline-none focus:border-[#1768bd] disabled:opacity-50"
                      >
                        {statusPossiveis.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      aria-label={`Excluir quiz ${quiz.titulo}`}
                      onClick={() => void removerQuiz(quiz)}
                      className="rounded-lg border border-[#d4dce6] p-2 text-slate-600 transition hover:border-rose-400 hover:text-rose-700"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#d4dce6] px-6 py-14 text-center">
          <p className="mt-3 font-medium text-[#242a33]">
            Nenhum quiz cadastrado
          </p>
          <p className="mt-1 text-sm text-[#626c79]">
            Crie o primeiro quiz e vincule-o a uma aula.
          </p>
        </div>
      )}
      {!carregando && (
        <AdminPagination
          pagina={pagina}
          totalPaginas={totalPaginas}
          total={filtrados.length}
          inicio={inicio}
          fim={fim}
          onPagina={irParaPagina}
        />
      )}
    </section>
  );
}
