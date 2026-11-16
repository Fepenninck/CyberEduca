"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  listarHistorico,
  listarUsuarios,
  type AdminUsuario,
  type FiltrosHistorico,
  type PaginaHistorico,
} from "@/lib/admin-api";

const acoes: Record<string, string> = {
  CADASTRO: "Cadastro",
  LOGIN: "Entrada",
  LOGIN_FALHOU: "Falha de entrada",
  LOGOUT: "Saída",
  CRIAR: "Criação",
  ATUALIZAR: "Atualização",
  EXCLUIR: "Exclusão",
  CONCLUIR_AULA: "Conclusão de aula",
};
const inicial = {
  busca: "",
  usuarioId: "",
  acao: "",
  resultado: "",
  inicio: "",
  fim: "",
};
export default function HistoricoPage() {
  const [form, setForm] = useState(inicial);
  const [filtros, setFiltros] = useState<FiltrosHistorico>({
    pagina: 1,
    limite: 4,
  });
  const [usuarios, setUsuarios] = useState<AdminUsuario[]>([]);
  const [dados, setDados] = useState<PaginaHistorico | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    const usuarioId =
      new URLSearchParams(window.location.search).get("usuarioId") ?? "";
    if (usuarioId) {
      setForm((atual) => ({ ...atual, usuarioId }));
      setFiltros((atual) => ({ ...atual, usuarioId }));
    }
    let ativo = true;
    listarUsuarios()
      .then((value) => {
        if (ativo) setUsuarios(value);
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);
  useEffect(() => {
    const abort = new AbortController();
    setCarregando(true);
    setErro(null);
    setDados(null);
    listarHistorico(filtros, abort.signal)
      .then((value) => {
        if (!abort.signal.aborted) setDados(value);
      })
      .catch((falha) => {
        if (!abort.signal.aborted)
          setErro(
            falha instanceof Error
              ? falha.message
              : "Não foi possível carregar o histórico.",
          );
      })
      .finally(() => {
        if (!abort.signal.aborted) setCarregando(false);
      });
    return () => abort.abort();
  }, [filtros, tentativa]);
  function aplicar(event: FormEvent) {
    event.preventDefault();
    if (form.inicio && form.fim && form.inicio > form.fim) {
      setErro("A data inicial deve ser anterior ou igual à data final.");
      return;
    }
    setFiltros({
      ...form,
      inicio: form.inicio ? `${form.inicio}T00:00:00-03:00` : "",
      fim: form.fim ? `${form.fim}T23:59:59.999-03:00` : "",
      busca: form.busca.trim(),
      pagina: 1,
      limite: 4,
    });
  }
  return (
    <section className="admin-history" aria-busy={carregando}>
      <div className="admin-page-title">
        <div>
          <p>ACOMPANHAMENTO</p>
          <h2>Histórico de atividades</h2>
          <span>
            Consulte entradas, saídas, conclusões de aulas e operações
            registradas por usuário.
          </span>
        </div>
        <button
          className="admin-action-secondary"
          disabled={carregando}
          onClick={() => setTentativa((value) => value + 1)}
        >
          {carregando ? "Atualizando..." : "Atualizar"}
        </button>
      </div>
      <form onSubmit={aplicar} className="admin-filter-panel">
        <div className="admin-filter-grid">
          <label>
            Buscar
            <input
              className="admin-control"
              type="search"
              maxLength={120}
              placeholder="Nome, e-mail ou recurso"
              value={form.busca}
              onChange={(e) => setForm({ ...form, busca: e.target.value })}
            />
          </label>
          <label>
            Usuário
            <select
              className="admin-control"
              value={form.usuarioId}
              onChange={(e) => setForm({ ...form, usuarioId: e.target.value })}
            >
              <option value="">Todos os usuários</option>
              {form.usuarioId &&
                !usuarios.some((u) => u.id === form.usuarioId) && (
                  <option value={form.usuarioId}>Usuário selecionado</option>
                )}
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome} · {u.email}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ação
            <select
              className="admin-control"
              value={form.acao}
              onChange={(e) => setForm({ ...form, acao: e.target.value })}
            >
              <option value="">Todas as ações</option>
              {Object.entries(acoes).map(([value, text]) => (
                <option value={value} key={value}>
                  {text}
                </option>
              ))}
            </select>
          </label>
          <label>
            Resultado
            <select
              className="admin-control"
              value={form.resultado}
              onChange={(e) => setForm({ ...form, resultado: e.target.value })}
            >
              <option value="">Todos os resultados</option>
              <option value="sucesso">Sucesso</option>
              <option value="falha">Falha</option>
            </select>
          </label>
          <label>
            Data inicial
            <input
              className="admin-control"
              type="date"
              value={form.inicio}
              onChange={(e) => setForm({ ...form, inicio: e.target.value })}
            />
          </label>
          <label>
            Data final
            <input
              className="admin-control"
              type="date"
              min={form.inicio || undefined}
              value={form.fim}
              onChange={(e) => setForm({ ...form, fim: e.target.value })}
            />
          </label>
        </div>
        <div className="admin-filter-actions">
          <span>
            Datas no horário de Brasília. Registros históricos podem não
            identificar o autor.
          </span>
          <button
            type="button"
            className="admin-action-secondary"
            onClick={() => {
              setForm(inicial);
              setFiltros({ pagina: 1, limite: 4 });
              window.history.replaceState(
                window.history.state,
                "",
                "/admin/historico",
              );
            }}
          >
            Limpar filtros
          </button>
          <button
            className="admin-action-primary"
            type="submit"
            disabled={carregando}
          >
            Aplicar filtros
          </button>
        </div>
      </form>
      {erro && (
        <div role="alert" className="admin-notice" data-tone="danger">
          {erro}{" "}
          <button
            type="button"
            onClick={() => setTentativa((value) => value + 1)}
          >
            Tentar novamente
          </button>
        </div>
      )}
      <div className="admin-data-panel">
        <div className="admin-data-heading">
          <h3>Atividades registradas</h3>
          <span aria-live="polite">
            {dados
              ? `${dados.total.toLocaleString("pt-BR")} registros encontrados`
              : carregando
                ? "Consultando..."
                : "Consulta indisponível"}
          </span>
        </div>
        {carregando ? (
          <p role="status" className="admin-empty-state">
            Carregando histórico...
          </p>
        ) : dados && !dados.registros.length ? (
          <div className="admin-empty-state">
            <strong>Nenhuma atividade encontrada</strong>
            <p>Altere os filtros ou aguarde novos registros de atividade.</p>
          </div>
        ) : (
          dados && (
            <div className="admin-table-scroll">
              <table className="admin-history-table">
                <thead>
                  <tr>
                    <th>Data e hora</th>
                    <th>Usuário</th>
                    <th>Ação</th>
                    <th>Recurso</th>
                    <th>Resultado</th>
                    <th>Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.registros.map((registro) => (
                    <tr key={registro.id}>
                      <td>
                        <time dateTime={registro.criadoEm}>
                          {new Date(registro.criadoEm).toLocaleString("pt-BR", {
                            timeZone: "America/Sao_Paulo",
                            dateStyle: "short",
                            timeStyle: "medium",
                          })}
                        </time>
                      </td>
                      <td>
                        {registro.ator ? (
                          <>
                            <Link
                              href={`/admin/usuarios/${encodeURIComponent(registro.ator.id)}/editar`}
                            >
                              {registro.ator.nome}
                            </Link>
                            <small>{registro.ator.email}</small>
                          </>
                        ) : (
                          <span>Autor não identificado</span>
                        )}
                      </td>
                      <td>{acoes[registro.acao] ?? registro.acao}</td>
                      <td>{registro.entidade}</td>
                      <td>
                        <span
                          className="admin-status-label"
                          data-tone={registro.sucesso ? "success" : "danger"}
                        >
                          {registro.sucesso ? "Sucesso" : "Falha"}
                        </span>
                      </td>
                      <td>
                        <details>
                          <summary>Ver detalhes</summary>
                          <dl>
                            <dt>Registro</dt>
                            <dd>{registro.id}</dd>
                            {registro.entidadeId && (
                              <>
                                <dt>Recurso</dt>
                                <dd>{registro.entidadeId}</dd>
                              </>
                            )}
                            {registro.metodo && (
                              <>
                                <dt>Operação</dt>
                                <dd>
                                  {registro.metodo} {registro.rota}
                                </dd>
                              </>
                            )}
                          </dl>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
        {dados && (
          <div className="admin-pagination">
            <span>
              Página {dados.pagina} de {dados.paginas}
            </span>
            <div>
              <button
                type="button"
                className="admin-action-secondary"
                disabled={carregando || dados.pagina <= 1}
                onClick={() =>
                  setFiltros({ ...filtros, pagina: dados.pagina - 1 })
                }
              >
                Anterior
              </button>
              <button
                type="button"
                className="admin-action-secondary"
                disabled={carregando || dados.pagina >= dados.paginas}
                onClick={() =>
                  setFiltros({ ...filtros, pagina: dados.pagina + 1 })
                }
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
