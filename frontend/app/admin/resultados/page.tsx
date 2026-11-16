"use client";

import {
  AdminListToolbar,
  AdminPagination,
  useAdminCollection,
} from "@/components/admin/list-toolbar";
import { useEffect, useState } from "react";
import {
  listarResultadosProvas,
  listarResultadosSimulacoes,
  type ResultadoProvaAdmin,
  type ResultadoSimulacaoAdmin,
} from "@/lib/admin-api";

import { diasDoPeriodo, filtrarPeriodo, mediaNotas, situacaoNota, lerFiltroResultadosDashboard, type FiltroResultadosDashboard } from '@/lib/admin-dashboard';

type AbaResultados = "provas" | "simulacoes";

function formatarData(data: string) {
  return new Date(data).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function AdminResultadosPage() {
  const [periodoDashboard, setPeriodoDashboard] = useState<FiltroResultadosDashboard | null>(null);
  const [aba, setAba] = useState<AbaResultados>("provas");
  const [resultadosProvas, setResultadosProvas] = useState<
    ResultadoProvaAdmin[]
  >([]);
  const [resultadosSimulacoes, setResultadosSimulacoes] = useState<
    ResultadoSimulacaoAdmin[]
  >([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const sincronizarAba = () => {
      setPeriodoDashboard(lerFiltroResultadosDashboard(window.location.search));
      const faixa = new URLSearchParams(window.location.search).get('faixa');
      setFiltro(faixa && ['warning', 'success', 'danger'].includes(faixa) ? faixa : 'TODOS');
      if (window.location.hash === "#simulacoes") setAba("simulacoes");
      else if (window.location.hash === "#provas") setAba("provas");
    };
    sincronizarAba();
    window.addEventListener("hashchange", sincronizarAba);
    window.addEventListener("popstate", sincronizarAba);
    let ativo = true;
    Promise.all([listarResultadosProvas(), listarResultadosSimulacoes()])
      .then(([provas, simulacoes]) => {
        if (!ativo) return;
        setResultadosProvas(provas);
        setResultadosSimulacoes(simulacoes);
      })
      .catch((falha: unknown) => {
        if (ativo)
          setErro(
            falha instanceof Error
              ? falha.message
              : "Não foi possível carregar os resultados.",
          );
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
      window.removeEventListener("hashchange", sincronizarAba);
      window.removeEventListener("popstate", sincronizarAba);
    };
  }, []);

  const todasLinhas =
    aba === "provas"
      ? resultadosProvas.map((resultado) => ({
          id: resultado.id,
          aluno: resultado.usuario.nome,
          email: resultado.usuario.email,
          titulo: resultado.prova.titulo,
          acertos: resultado.acertos,
          total: resultado.totalQuestoes,
          criadoEm: resultado.criadoEm,
        }))
      : resultadosSimulacoes.map((resultado) => ({
          id: resultado.id,
          aluno: resultado.usuario.nome,
          email: resultado.usuario.email,
          titulo: resultado.simulacao.titulo,
          acertos: resultado.acertos,
          total: resultado.totalQuestoes,
          criadoEm: resultado.criadoEm,
        }));

  const linhas = periodoDashboard ? filtrarPeriodo(todasLinhas, diasDoPeriodo(periodoDashboard.dias, new Date(periodoDashboard.ate)), new Date(periodoDashboard.ate)) : todasLinhas;
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
  } = useAdminCollection(linhas, (item) =>
    [item.aluno, item.email, item.titulo].join(" "),
    (item) => situacaoNota(mediaNotas([{acertos: item.acertos, totalQuestoes: item.total}])).tom,
  );

  return (
    <section>
      <header className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1768bd]">
          Acompanhamento
        </p>
        <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-[#242a33]">
          Resultados dos alunos
        </h1>
        <p className="mt-2 text-sm text-[#626c79]">
          Consulte as conclusões e o desempenho nas provas e simulações.
        </p>
      </header>

      <div
        className="mb-5 flex gap-2"
        role="tablist"
        aria-label="Tipo de resultado"
      >
        {(["provas", "simulacoes"] as const).map((tipo) => (
          <button
            key={tipo}
            id={`aba-${tipo}`}
            type="button"
            role="tab"
            aria-selected={aba === tipo}
            onClick={() => {
              setAba(tipo);
              setBusca("");
              setFiltro("TODOS");
              const url = new URL(window.location.href);
              url.searchParams.delete("faixa");
              url.hash = tipo;
              window.history.replaceState(null, "", url);
            }}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${aba === tipo ? "bg-[#1768bd] text-[#ffffff]" : "border border-[#d4dce6] text-slate-600 hover:border-[#1768bd] hover:text-[#242a33]"}`}
          >
            {tipo === "provas" ? "Provas" : "Simulações"}
          </button>
        ))}
      </div>

      <AdminListToolbar
        busca={busca}
        onBusca={setBusca}
        total={linhas.length}
        exibidos={filtrados.length}
        filtro={filtro}
        onFiltro={setFiltro}
        filtroLabel="Desempenho"
        opcoes={[{value:'TODOS',label:'Todos'}, {value:'warning',label:'Precisam de atenção (40% a menos de 70%)'}, {value:'success',label:'Bom desempenho (70% ou mais)'}, {value:'danger',label:'Precisam de reforço (abaixo de 40%)'}]}
      />
      {periodoDashboard && <p className="admin-form-help" style={{marginBottom:16}}>Período do dashboard: {periodoDashboard.dias} dias, até {formatarData(periodoDashboard.ate)}. <button type="button" className="admin-action-secondary" onClick={() => {setPeriodoDashboard(null);setFiltro('TODOS');setBusca('');window.history.replaceState(null,'',window.location.pathname + window.location.hash);}}>Limpar filtros do dashboard</button></p>}
      {(busca || filtro !== "TODOS") && !filtrados.length && !carregando && (
        <p className="admin-empty-state" role="status">
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
      <div
        role="tabpanel"
        aria-labelledby={`aba-${aba}`}
        className="overflow-hidden rounded-2xl border border-[#dce1e8] bg-[#ffffff]"
      >
        {carregando ? (
          <div className="space-y-3 p-5" aria-label="Carregando resultados">
            <p role="status" className="text-sm text-[#626c79]">
              Carregando...
            </p>
          </div>
        ) : filtrados.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[#f5f7fa] text-xs uppercase tracking-wide text-[#626c79]">
                <tr>
                  <th className="px-5 py-3">Nome do aluno</th>
                  <th className="px-5 py-3">E-mail</th>
                  <th className="px-5 py-3">Avaliação</th>
                  <th className="px-5 py-3">Acertos / Total</th>
                  <th className="px-5 py-3">Data da conclusão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dce1e8]">
                {visiveis.map((linha) => (
                  <tr key={linha.id}>
                    <td className="px-5 py-4 font-medium text-[#242a33]">
                      {linha.aluno}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{linha.email}</td>
                    <td className="px-5 py-4 text-slate-600">{linha.titulo}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {linha.acertos} / {linha.total}
                    </td>
                    <td className="px-5 py-4 text-[#626c79]">
                      {formatarData(linha.criadoEm)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="mt-3 font-medium text-[#242a33]">
              {linhas.length ? "Nenhum resultado corresponde aos filtros" : "Ainda não há resultados neste período"}
            </p>
            <p className="mt-1 text-sm text-[#626c79]">
              Altere os filtros ou aguarde novas atividades dos alunos.
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
