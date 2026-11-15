"use client";

import {
  AdminListToolbar,
  AdminPagination,
  FILTROS_DISPONIBILIDADE,
  useAdminCollection,
} from "@/components/admin/list-toolbar";
import { useEffect, useState } from "react";
import { FormularioTrilha } from "@/components/admin/formulario-trilha";
import {
  criarTrilha,
  editarTrilha,
  excluirTrilha,
  listarTrilhas,
  type AdminTrilha,
  type TrilhaInput,
} from "@/lib/admin-api";

export default function AdminTrilhasPage() {
  const [trilhas, setTrilhas] = useState<AdminTrilha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [trilhaEditando, setTrilhaEditando] = useState<AdminTrilha | null>(
    null,
  );
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
    trilhas,
    (item) => [item.titulo, item.descricao, item.nivel].join(" "),
    (item) => (item.bloqueada ? "INATIVAS" : "ATIVAS"),
  );

  useEffect(() => {
    if (window.location.hash === "#nova") {
      setMostrarFormulario(true);
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname + window.location.search,
      );
    }
    let ativo = true;
    setCarregando(true);
    setErro(null);

    listarTrilhas()
      .then((dados) => {
        if (ativo) setTrilhas(dados);
      })
      .catch((erroBusca: unknown) => {
        if (ativo)
          setErro(
            erroBusca instanceof Error
              ? erroBusca.message
              : "Não foi possível carregar as trilhas.",
          );
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [atualizacao]);

  function novaTrilha() {
    setTrilhaEditando(null);
    setMostrarFormulario(true);
  }

  async function salvarTrilha(dados: TrilhaInput) {
    if (trilhaEditando) {
      await editarTrilha(trilhaEditando.id, dados);
    } else {
      await criarTrilha(dados);
    }
    setSucesso("Trilha salva com sucesso.");
    setMostrarFormulario(false);
    setTrilhaEditando(null);
    setAtualizacao((valor) => valor + 1);
  }

  async function removerTrilha(id: string) {
    if (!window.confirm("Tem certeza que deseja excluir?")) return;
    setErro(null);
    try {
      await excluirTrilha(id);
      setAtualizacao((valor) => valor + 1);
    } catch (erroExclusao) {
      setErro(
        erroExclusao instanceof Error
          ? erroExclusao.message
          : "Não foi possível excluir a trilha.",
      );
    }
  }

  return (
    <section>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1768bd]">
            Conteúdo
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#242a33]">
            Trilhas
          </h2>
          <p className="mt-2 text-sm text-[#626c79]">
            Crie, organize e atualize as trilhas de aprendizagem.
          </p>
        </div>
        <button
          type="button"
          onClick={novaTrilha}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1768bd] px-4 py-2.5 text-sm font-semibold text-[#ffffff] transition hover:bg-[#12569d]"
        >
          Nova Trilha
        </button>
      </div>

      {mostrarFormulario && !carregando && (
        <div className="mb-7">
          <h3 className="mb-3 text-lg font-semibold text-[#242a33]">
            {trilhaEditando ? "Editar trilha" : "Nova trilha"}
          </h3>
          <FormularioTrilha
            key={trilhaEditando?.id ?? "nova-trilha"}
            initialValues={
              trilhaEditando ?? {
                ordem: Math.max(0, ...trilhas.map((item) => item.ordem)) + 1,
              }
            }
            submitLabel={trilhaEditando ? "Salvar alterações" : "Criar trilha"}
            onSubmit={salvarTrilha}
            onCancel={() => {
              setMostrarFormulario(false);
              setTrilhaEditando(null);
            }}
          />
        </div>
      )}

      {sucesso && (
        <p role="status" className="admin-notice" data-tone="success">
          {sucesso}
        </p>
      )}
      <AdminListToolbar
        busca={busca}
        onBusca={setBusca}
        total={trilhas.length}
        exibidos={filtrados.length}
        filtro={filtro}
        onFiltro={setFiltro}
        opcoes={FILTROS_DISPONIBILIDADE}
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
      ) : trilhas.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {visiveis.map((trilha) => (
            <article
              key={trilha.id}
              className="rounded-2xl border border-[#dce1e8] bg-[#ffffff] p-5 transition hover:border-[#afc7e5]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-[#242a33]">
                      {trilha.titulo}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#626c79]">
                      {trilha.descricao}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    aria-label={`Editar ${trilha.titulo}`}
                    onClick={() => {
                      setTrilhaEditando(trilha);
                      setMostrarFormulario(true);
                    }}
                    className="rounded-lg border border-[#d4dce6] p-2 text-slate-600 transition hover:border-[#1768bd] hover:text-[#1768bd]"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    aria-label={`Excluir ${trilha.titulo}`}
                    onClick={() => void removerTrilha(trilha.id)}
                    className="rounded-lg border border-[#d4dce6] p-2 text-slate-600 transition hover:border-rose-400 hover:text-rose-700"
                  >
                    Excluir
                  </button>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#e7ebf0] pt-4 text-xs text-[#626c79]">
                <span className="rounded-full bg-white/[0.06] px-2.5 py-1">
                  Ordem {trilha.ordem}
                </span>
                <span className="rounded-full bg-white/[0.06] px-2.5 py-1">
                  {trilha.totalAulas}{" "}
                  {trilha.totalAulas === 1 ? "aula" : "aulas"}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 ${trilha.bloqueada ? "bg-amber-300/10 text-amber-700" : "bg-[#1768bd]/10 text-[#315b8e]"}`}
                >
                  {trilha.bloqueada ? "Bloqueada" : "Disponível"}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#d4dce6] px-6 py-14 text-center">
          <p className="mt-3 font-medium text-[#242a33]">
            Ainda não há trilhas cadastradas
          </p>
          <p className="mt-1 text-sm text-[#626c79]">
            Crie a primeira trilha para começar a organizar o conteúdo.
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
