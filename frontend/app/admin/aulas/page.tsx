"use client";

import {
  AdminListToolbar,
  AdminPagination,
  FILTROS_DISPONIBILIDADE,
  useAdminCollection,
} from "@/components/admin/list-toolbar";
import { useEffect, useState } from "react";
import { FormularioAula } from "@/components/admin/formulario-aula";
import { resumoConteudoAula } from "@/lib/admin-lesson-editor";
import {
  criarAula,
  editarAula,
  excluirAula,
  listarAulas,
  listarTrilhas,
  type AdminAula,
  type AdminTrilha,
  type AulaInput,
} from "@/lib/admin-api";

export default function AdminAulasPage() {
  const [aulas, setAulas] = useState<AdminAula[]>([]);
  const [trilhas, setTrilhas] = useState<AdminTrilha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [aulaEditando, setAulaEditando] = useState<AdminAula | null>(null);
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
    aulas,
    (item) => [item.titulo, item.trilha.titulo, item.conteudo].join(" "),
    (item) =>
      (trilhas.find((trilha) => trilha.id === item.trilhaId)?.bloqueada ??
      item.trilha.bloqueada)
        ? "INATIVAS"
        : "ATIVAS",
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

    Promise.all([listarAulas(), listarTrilhas()])
      .then(([listaAulas, listaTrilhas]) => {
        if (ativo) {
          setAulas(listaAulas);
          setTrilhas(listaTrilhas);
        }
      })
      .catch((erroBusca: unknown) => {
        if (ativo)
          setErro(
            erroBusca instanceof Error
              ? erroBusca.message
              : "Não foi possível carregar as aulas.",
          );
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [atualizacao]);

  function novaAula() {
    setAulaEditando(null);
    setMostrarFormulario(true);
  }

  async function salvarAula(dados: AulaInput) {
    if (aulaEditando) {
      await editarAula(aulaEditando.id, dados);
    } else {
      await criarAula(dados);
    }
    setSucesso("Aula salva com sucesso.");
    setMostrarFormulario(false);
    setAulaEditando(null);
    setAtualizacao((valor) => valor + 1);
  }

  async function removerAula(id: string) {
    if (!window.confirm("Tem certeza que deseja excluir?")) return;
    setErro(null);
    try {
      await excluirAula(id);
      setAtualizacao((valor) => valor + 1);
    } catch (erroExclusao) {
      setErro(
        erroExclusao instanceof Error
          ? erroExclusao.message
          : "Não foi possível excluir a aula.",
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
            Aulas
          </h2>
          <p className="mt-2 text-sm text-[#626c79]">
            Gerencie as aulas e associe cada conteúdo a uma trilha.
          </p>
        </div>
        <button
          type="button"
          onClick={novaAula}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1768bd] px-4 py-2.5 text-sm font-semibold text-[#ffffff] transition hover:bg-[#12569d]"
        >
          Nova Aula
        </button>
      </div>

      {mostrarFormulario && !carregando && (
        <div className="mb-7">
          <h3 className="mb-3 text-lg font-semibold text-[#242a33]">
            {aulaEditando ? "Editar aula" : "Nova aula"}
          </h3>
          <FormularioAula
            key={aulaEditando?.id ?? "nova-aula"}
            trilhas={trilhas}
            aulasExistentes={aulas}
            initialValues={aulaEditando ?? undefined}
            submitLabel={aulaEditando ? "Salvar alterações" : "Criar aula"}
            onSubmit={salvarAula}
            onCancel={() => {
              setMostrarFormulario(false);
              setAulaEditando(null);
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
        total={aulas.length}
        exibidos={filtrados.length}
        filtro={filtro}
        onFiltro={setFiltro}
        opcoes={FILTROS_DISPONIBILIDADE}
        filtroLabel="Disponibilidade da trilha"
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
        <div className="space-y-3">
          <p role="status" className="text-sm text-[#626c79]">
            Carregando...
          </p>
        </div>
      ) : aulas.length ? (
        <div className="space-y-3">
          {visiveis.map((aula) => (
            <article
              key={aula.id}
              className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-[#dce1e8] bg-[#ffffff] p-5 transition hover:border-[#afc7e5]"
            >
              <div className="flex min-w-0 flex-1 gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-[#242a33]">
                    {aula.titulo}
                  </h3>
                  <p className="mt-1 text-xs font-medium text-[#1768bd]">
                    {aula.trilha.titulo}
                  </p>
                  <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm leading-5 text-[#626c79]">
                    {resumoConteudoAula(aula.conteudo)}
                  </p>
                  <p className="mt-3 text-xs text-slate-500">
                    Ordem {aula.ordem}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  aria-label={`Editar ${aula.titulo}`}
                  onClick={() => {
                    setAulaEditando(aula);
                    setMostrarFormulario(true);
                  }}
                  className="rounded-lg border border-[#d4dce6] p-2 text-slate-600 transition hover:border-[#1768bd] hover:text-[#1768bd]"
                >
                  Editar
                </button>
                <button
                  type="button"
                  aria-label={`Excluir ${aula.titulo}`}
                  onClick={() => void removerAula(aula.id)}
                  className="rounded-lg border border-[#d4dce6] p-2 text-slate-600 transition hover:border-rose-400 hover:text-rose-700"
                >
                  Excluir
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#d4dce6] px-6 py-14 text-center">
          <p className="mt-3 font-medium text-[#242a33]">
            Ainda não há aulas cadastradas
          </p>
          <p className="mt-1 text-sm text-[#626c79]">
            Crie uma aula e associe-a a uma trilha existente.
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
