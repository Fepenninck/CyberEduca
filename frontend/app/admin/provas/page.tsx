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
  alterarStatusProva,
  excluirProva,
  listarProvasAdmin,
  type ProvaAdmin,
  type StatusProvaAdmin,
} from "@/lib/admin-api";

const statusOptions: StatusProvaAdmin[] = [
  "RASCUNHO",
  "PUBLICADO",
  "ARQUIVADO",
];

const statusClass: Record<StatusProvaAdmin, string> = {
  RASCUNHO: "bg-slate-100 text-slate-600",
  PUBLICADO: "bg-[#1768bd]/10 text-[#315b8e]",
  ARQUIVADO: "bg-amber-300/10 text-amber-700",
};

export default function AdminProvasPage() {
  const [provas, setProvas] = useState<ProvaAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [provaAtualizando, setProvaAtualizando] = useState<string | null>(null);
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
    provas,
    (item) =>
      [
        item.titulo,
        item.descricao,
        item.status,
        item.trilha?.titulo ?? "",
      ].join(" "),
    (item) => (item.status === "PUBLICADO" ? "ATIVAS" : "INATIVAS"),
  );

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro(null);

    listarProvasAdmin()
      .then((dados) => {
        if (ativo) setProvas(dados);
      })
      .catch((erroBusca: unknown) => {
        if (ativo)
          setErro(
            erroBusca instanceof Error
              ? erroBusca.message
              : "Não foi possível carregar as provas.",
          );
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [atualizacao]);

  async function mudarStatus(prova: ProvaAdmin, status: StatusProvaAdmin) {
    if (status === prova.status) return;
    setProvaAtualizando(prova.id);
    setErro(null);

    try {
      await alterarStatusProva(prova.id, status);
      setProvas((lista) =>
        lista.map((item) =>
          item.id === prova.id ? { ...item, status } : item,
        ),
      );
    } catch (erroStatus) {
      setErro(
        erroStatus instanceof Error
          ? erroStatus.message
          : "Não foi possível alterar o status da prova.",
      );
    } finally {
      setProvaAtualizando(null);
    }
  }

  async function removerProva(prova: ProvaAdmin) {
    if (!window.confirm("Tem certeza que deseja excluir?")) return;
    setErro(null);
    try {
      await excluirProva(prova.id);
      setAtualizacao((valor) => valor + 1);
    } catch (erroExclusao) {
      setErro(
        erroExclusao instanceof Error
          ? erroExclusao.message
          : "Não foi possível excluir a prova.",
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
          <h2 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-[#242a33]">
            Provas
          </h2>
          <p className="mt-2 text-sm text-[#626c79]">
            Crie avaliações por trilha e organize questões e alternativas.
          </p>
        </div>
        <Link
          href="/admin/provas/nova"
          className="inline-flex items-center gap-2 rounded-lg bg-[#1768bd] px-4 py-2.5 text-sm font-semibold text-[#ffffff] transition hover:bg-[#12569d]"
        >
          Nova Prova
        </Link>
      </div>

      <AdminListToolbar
        busca={busca}
        onBusca={setBusca}
        total={provas.length}
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
      ) : provas.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {visiveis.map((prova) => (
            <article
              key={prova.id}
              className="rounded-2xl border border-[#dce1e8] bg-[#ffffff] p-5"
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-[#242a33]">
                    {prova.titulo}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#626c79]">
                    {prova.descricao}
                  </p>
                </div>
                <Link
                  href={`/admin/provas/${encodeURIComponent(prova.id)}/editar`}
                  aria-label={`Editar prova ${prova.titulo}`}
                  className="rounded-lg border border-[#d4dce6] p-2 text-slate-600 transition hover:border-[#1768bd] hover:text-[#1768bd]"
                >
                  Editar
                </Link>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#e7ebf0] pt-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[prova.status]}`}
                  >
                    {prova.status}
                  </span>
                  <span className="text-xs text-slate-500">
                    {prova.questoes?.length ?? 0} questões
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-[#626c79]">
                    Status
                    <select
                      aria-label={`Status da prova ${prova.titulo}`}
                      value={prova.status}
                      disabled={provaAtualizando === prova.id}
                      onChange={(event) =>
                        void mudarStatus(
                          prova,
                          event.target.value as StatusProvaAdmin,
                        )
                      }
                      className="rounded-md border border-[#d4dce6] bg-[#f5f7fa] px-2 py-1.5 text-xs text-[#242a33] outline-none focus:border-[#1768bd] disabled:opacity-50"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    aria-label={`Excluir prova ${prova.titulo}`}
                    onClick={() => void removerProva(prova)}
                    className="rounded-lg border border-[#d4dce6] p-2 text-slate-600 transition hover:border-rose-400 hover:text-rose-700"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#d4dce6] px-6 py-14 text-center">
          <p className="mt-3 font-medium text-[#242a33]">
            Nenhuma prova cadastrada
          </p>
          <p className="mt-1 text-sm text-[#626c79]">
            Crie uma prova para começar a estruturar a avaliação.
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
