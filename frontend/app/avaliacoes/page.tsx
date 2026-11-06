"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ActivityShell } from "@/components/activities/activity-shell";
import { assessments } from "@/lib/library-activities";
import { ClipboardCheck, ArrowUpRight } from "lucide-react";
export default function AvaliacoesPage() {
  const [results, setResults] = useState<
    Record<string, { totalAcertos: number; totalQuestoes: number }>
  >({});
  useEffect(() => {
    const saved: typeof results = {};
    for (const item of assessments) {
      try {
        const value = JSON.parse(
          localStorage.getItem(`cybereduca-result-${item.id}`) || "null",
        );
        if (
          value &&
          Number.isFinite(value.totalAcertos) &&
          value.totalQuestoes > 0
        )
          saved[item.id] = value;
      } catch {
        /* Sem resultado local. */
      }
    }
    setResults(saved);
  }, []);
  return (
    <ActivityShell
      section="avaliacoes"
      title="Veja o quanto você aprendeu."
      description="Autoavaliações por nível, com resultado em percentual e revisão comentada. Escolha um nível e responda no seu ritmo."
    >
      <div className="activity-banner">
        <ClipboardCheck size={28} />
        <div>
          <strong>Uma visão do seu aprendizado</strong>
          <p>
            Cada avaliação reúne questões das quatro trilhas do nível. Sem
            cronômetro ou aprovação formal.
          </p>
        </div>
      </div>
      <div className="activity-grid">
        {assessments.map((a, i) => (
          <article className="activity-card" key={a.id}>
            <span className="activity-kicker">
              AVALIAÇÃO {String(i + 1).padStart(2, "0")}
            </span>
            <h2>{a.titulo}</h2>
            <p>{a.descricao}</p>
            <span className="activity-lesson">
              {a.questoes.length} questões · resultado comentado
            </span>
            {results[a.id] && (
              <p className="assessment-score">
                Último resultado local:{" "}
                {Math.round(
                  (results[a.id].totalAcertos / results[a.id].totalQuestoes) *
                    100,
                )}
                %
              </p>
            )}
            <Link className="activity-card-link" href={`/avaliacoes/${a.id}`}>
              Iniciar avaliação <ArrowUpRight size={18} />
            </Link>
          </article>
        ))}
      </div>
      <p className="activity-footnote">
        As avaliações da biblioteca são autoavaliações educativas. Os resultados
        ficam neste navegador quando o armazenamento está disponível; não geram
        certificado nem alteram o progresso da conta.
      </p>
    </ActivityShell>
  );
}
