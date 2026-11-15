"use client";

import {
  AdminListToolbar,
  AdminPagination,
  useAdminCollection,
} from "@/components/admin/list-toolbar";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { FormularioSimulacao } from "@/components/admin/formulario-simulacao";
import {
  criarSimulacao,
  criarCategoriaSimulacao,
  editarSimulacao,
  excluirSimulacao,
  listarSimulacoes,
  listarCategoriasSimulacao,
  type CategoriaSimulacaoAdmin,
  type SimulacaoAdmin,
  type SimulacaoInput,
} from "@/lib/admin-api";

export default function AdminSimulacoesPage() {
  const [simulacoes, setSimulacoes] = useState<SimulacaoAdmin[]>([]);
  const [categorias, setCategorias] = useState<CategoriaSimulacaoAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<SimulacaoAdmin | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [atualizacao, setAtualizacao] = useState(0);
  const [nomeCategoria, setNomeCategoria] = useState("");
  const [descricaoCategoria, setDescricaoCategoria] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const [listaSimulacoes, listaCategorias] = await Promise.all([
        listarSimulacoes(),
        listarCategoriasSimulacao(),
      ]);
      setSimulacoes(listaSimulacoes);
      setCategorias(listaCategorias);
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível carregar as simulações.",
      );
    } finally {
      setCarregando(false);
    }
  }, []);

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
    simulacoes,
    (item) =>
      [item.titulo, item.descricao, item.categoria?.nome ?? ""].join(" "),
    (item) => item.categoriaId,
  );

  useEffect(() => {
    void carregar();
  }, [carregar, atualizacao]);

  async function salvar(dados: SimulacaoInput) {
    if (editando) await editarSimulacao(editando.id, dados);
    else await criarSimulacao(dados);

    setSucesso(editando ? "Simulação atualizada." : "Simulação criada.");
    setErro(null);
    setEditando(null);
    setFormAberto(false);
    setAtualizacao((valor) => valor + 1);
  }

  async function salvarCategoria(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    try {
      await criarCategoriaSimulacao({
        nome: nomeCategoria.trim(),
        descricao: descricaoCategoria.trim(),
      });
      setNomeCategoria("");
      setDescricaoCategoria("");
      setSucesso("Categoria criada.");
      setAtualizacao((valor) => valor + 1);
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível criar a categoria.",
      );
    }
  }

  async function excluir(simulacao: SimulacaoAdmin) {
    if (
      !window.confirm(
        `Tem certeza que deseja excluir a simulação "${simulacao.titulo}"?`,
      )
    )
      return;
    setErro(null);
    setSucesso(null);
    try {
      await excluirSimulacao(simulacao.id);
      setSucesso("Simulação excluída.");
      setAtualizacao((valor) => valor + 1);
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível excluir a simulação.",
      );
    }
  }

  function iniciarNova() {
    setEditando(null);
    setFormAberto(true);
    setErro(null);
    setSucesso(null);
  }

  return (
    <section>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1768bd]">
            Treinamento sem nota
          </p>
          <h2 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-[#242a33]">
            Simulações
          </h2>
          <p className="mt-2 text-sm text-[#626c79]">
            Crie cenários práticos com alternativas para treino e feedback
            imediato.
          </p>
        </div>
        <button
          type="button"
          onClick={iniciarNova}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1768bd] px-4 py-2.5 text-sm font-semibold text-[#ffffff] transition hover:bg-[#12569d]"
        >
          Nova simulação
        </button>
      </div>

      {sucesso && (
        <p
          role="status"
          className="mb-5 rounded-xl border border-[#1768bd]/25 bg-[#1768bd]/[0.07] px-4 py-3 text-sm text-[#315b8e]"
        >
          {sucesso}
        </p>
      )}
      <AdminListToolbar
        busca={busca}
        onBusca={setBusca}
        total={simulacoes.length}
        exibidos={filtrados.length}
        filtro={filtro}
        onFiltro={setFiltro}
        filtroLabel="Categoria"
        opcoes={[
          { value: "TODOS", label: "Todas as categorias" },
          ...categorias.map((item) => ({ value: item.id, label: item.nome })),
        ]}
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

      <form
        onSubmit={salvarCategoria}
        className="mb-7 grid gap-3 rounded-2xl border border-[#dce1e8] bg-[#ffffff] p-5 sm:grid-cols-[1fr_2fr_auto]"
      >
        <input
          aria-label="Nome da categoria"
          value={nomeCategoria}
          onChange={(event) => setNomeCategoria(event.target.value)}
          placeholder="Nova categoria"
          required
          maxLength={120}
          className="rounded-lg border border-[#d4dce6] bg-[#f5f7fa] px-3 py-2.5 text-sm text-[#242a33] outline-none focus:border-[#1768bd]"
        />
        <input
          aria-label="Descrição da categoria"
          value={descricaoCategoria}
          onChange={(event) => setDescricaoCategoria(event.target.value)}
          placeholder="Descrição"
          required
          maxLength={1000}
          className="rounded-lg border border-[#d4dce6] bg-[#f5f7fa] px-3 py-2.5 text-sm text-[#242a33] outline-none focus:border-[#1768bd]"
        />
        <button
          type="submit"
          className="rounded-lg border border-[#afc7e5] px-4 py-2 text-sm font-semibold text-[#242a33] transition hover:border-[#1768bd]"
        >
          Criar categoria
        </button>
        <p className="text-xs text-[#626c79] sm:col-span-3">
          Categorias:{" "}
          {categorias.map((categoria) => categoria.nome).join(", ") ||
            "nenhuma cadastrada"}
        </p>
      </form>

      {formAberto && !carregando && (
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-[#242a33]">
              {editando ? "Editar simulação" : "Nova simulação"}
            </h3>
            <button
              type="button"
              onClick={() => {
                setFormAberto(false);
                setEditando(null);
              }}
              className="text-sm text-[#626c79] transition hover:text-[#242a33]"
            >
              Cancelar
            </button>
          </div>
          <FormularioSimulacao
            categorias={categorias}
            key={editando?.id ?? "nova-simulacao"}
            initialValues={editando ?? undefined}
            onSubmit={salvar}
            submitLabel={editando ? "Salvar alterações" : "Criar simulação"}
          />
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#dce1e8] bg-[#ffffff]">
        <div className="border-b border-[#dce1e8] px-5 py-4">
          <h3 className="font-semibold text-[#242a33]">
            Simulações cadastradas
          </h3>
        </div>
        {carregando ? (
          <div className="space-y-3 p-5" aria-label="Carregando simulações">
            <p role="status" className="text-sm text-[#626c79]">
              Carregando...
            </p>
          </div>
        ) : simulacoes.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-[#f5f7fa] text-xs uppercase tracking-wide text-[#626c79]">
                <tr>
                  <th className="px-5 py-3">Título</th>
                  <th className="px-5 py-3">Categoria</th>
                  <th className="px-5 py-3">Questões</th>
                  <th className="px-5 py-3">Criada em</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dce1e8]">
                {visiveis.map((simulacao) => (
                  <tr key={simulacao.id}>
                    <td className="px-5 py-4">
                      <p className="font-medium text-[#242a33]">
                        {simulacao.titulo}
                      </p>
                      <p className="mt-1 max-w-lg truncate text-xs text-[#626c79]">
                        {simulacao.descricao}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {simulacao.categoria?.nome ??
                        categorias.find(
                          (categoria) => categoria.id === simulacao.categoriaId,
                        )?.nome ??
                        "-"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {simulacao.questoes.length}
                    </td>
                    <td className="px-5 py-4 text-[#626c79]">
                      {new Date(simulacao.criadoEm).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditando(simulacao);
                            setFormAberto(true);
                            setErro(null);
                            setSucesso(null);
                          }}
                          aria-label={`Editar ${simulacao.titulo}`}
                          className="rounded-lg border border-[#d4dce6] p-2 text-slate-600 transition hover:border-[#1768bd] hover:text-[#315b8e]"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void excluir(simulacao)}
                          aria-label={`Excluir ${simulacao.titulo}`}
                          className="rounded-lg border border-[#d4dce6] p-2 text-slate-600 transition hover:border-rose-400 hover:text-rose-700"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="font-medium text-[#242a33]">
              Nenhuma simulação cadastrada
            </p>
            <p className="mt-1 text-sm text-[#626c79]">
              Crie uma simulação para os alunos praticarem sem nota.
            </p>
          </div>
        )}
      </div>
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
