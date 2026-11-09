"use client";
import { useEffect, useState } from "react";
import {
  buscarMeuDesempenho,
  buscarDesempenhoUsuario,
  type Desempenho,
} from "@/lib/desempenho-api";

export function ResumoDesempenho({ usuarioId }: { usuarioId?: string }) {
  const [dados, setDados] = useState<Desempenho | null>(null),
    [erro, setErro] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let ativo = true;
    setLoading(true);
    setErro("");
    (usuarioId ? buscarDesempenhoUsuario(usuarioId) : buscarMeuDesempenho())
      .then((d) => {
        if (ativo) setDados(d);
      })
      .catch((e) => {
        if (ativo)
          setErro(
            e instanceof Error
              ? e.message
              : "Não foi possível carregar o desempenho.",
          );
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });
    return () => {
      ativo = false;
    };
  }, [usuarioId]);
  if (loading) return <p>Carregando desempenho…</p>;
  if (erro) return <p role="alert">{erro}</p>;
  if (!dados) return null;
  const data = (value: string) => new Date(value).toLocaleDateString("pt-BR");
  return (
    <section>
      <h1 className="mb-6 text-3xl">Desempenho de {dados.nome}</h1>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Aulas concluídas", dados.totalAulasConcluidas],
          ["Quizzes concluídos", dados.totalQuizzesConcluidos],
          ["Simulações concluídas", dados.totalSimulacoesConcluidas],
          ["Provas realizadas", dados.totalProvasRealizadas],
          ["Média das provas", dados.mediaNotas],
        ].map(([label, valor]) => (
          <div
            key={label}
            className="rounded-xl border border-slate-700 bg-slate-900 p-4"
          >
            <dt>{label}</dt>
            <dd className="mt-2 text-3xl text-[#b2ff00]">{valor}</dd>
          </div>
        ))}
      </dl>
      <h2 className="mt-8 text-xl">Provas e evolução das notas</h2>
      {!dados.provas.length && <p>Nenhuma prova realizada.</p>}
      <table className="my-4 w-full text-left">
        <thead>
          <tr>
            <th>Prova</th>
            <th>Data</th>
            <th>Nota</th>
            <th>Acertos objetivos</th>
          </tr>
        </thead>
        <tbody>
          {dados.provas.map((p) => (
            <tr key={p.id}>
              <td className="py-3">{p.prova.titulo}</td>
              <td>{data(p.concluidoEm)}</td>
              <td>
                <span>{p.nota.toFixed(1)}</span>
                <meter
                  className="ml-2"
                  min={0}
                  max={10}
                  value={p.nota}
                  aria-label={`Nota ${p.nota} em ${p.prova.titulo}`}
                />
              </td>
              <td>
                {p.totalAcertos}/{p.totalQuestoes}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 className="mt-8 text-xl">Quizzes</h2>
      <ul>
        {dados.quizzes.map((q) => (
          <li className="my-2" key={q.id}>
            {q.quiz.titulo} · {q.totalAcertos}/{q.totalQuestoes} acertos ·{" "}
            {data(q.concluidoEm)}
          </li>
        ))}
      </ul>
      {!dados.quizzes.length && <p>Nenhum quiz concluído.</p>}
      <h2 className="mt-8 text-xl">Simulações de phishing</h2>
      <ul>
        {dados.simulacoes.map((s) => (
          <li className="my-2" key={s.id}>
            {s.cenario.titulo} · {s.acertou ? "Acerto" : "Erro"} ·{" "}
            {data(s.concluidoEm)}
          </li>
        ))}
      </ul>
      {!dados.simulacoes.length && <p>Nenhuma simulação concluída.</p>}
      <h2 className="mt-8 text-xl">Aulas concluídas</h2>
      <ul>
        {dados.aulas.map((a) => (
          <li className="my-2" key={a.id}>
            {a.aula.titulo} · {data(a.dataConclusao)}
          </li>
        ))}
      </ul>
      {!dados.aulas.length && <p>Nenhuma aula concluída.</p>}
    </section>
  );
}
