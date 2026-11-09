"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { buscarRelatorios, type Desempenho } from "@/lib/desempenho-api";
export default function RelatoriosPage() {
  const [dados, setDados] = useState<Desempenho[]>([]),
    [erro, setErro] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    buscarRelatorios()
      .then(setDados)
      .catch((e) =>
        setErro(e instanceof Error ? e.message : "Falha ao carregar."),
      )
      .finally(() => setLoading(false));
  }, []);
  return (
    <section>
      <h1 className="mb-6 text-3xl">Relatórios de desempenho</h1>
      {loading && <p>Carregando…</p>}
      {erro && <p role="alert">{erro}</p>}
      <div className="overflow-auto">
        <table className="w-full text-left">
          <thead>
            <tr>
              {["Aluno", "Aulas", "Quizzes", "Phishing", "Provas", "Média"].map(
                (t) => (
                  <th className="p-3" key={t}>
                    {t}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {dados.map((d) => (
              <tr key={d.usuarioId}>
                <td className="p-3">
                  <Link
                    className="underline"
                    href={`/admin/usuarios/${d.usuarioId}`}
                  >
                    {d.nome}
                  </Link>
                </td>
                {[
                  d.totalAulasConcluidas,
                  d.totalQuizzesConcluidos,
                  d.totalSimulacoesConcluidas,
                  d.totalProvasRealizadas,
                  d.mediaNotas,
                ].map((v, i) => (
                  <td className="p-3" key={i}>
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
