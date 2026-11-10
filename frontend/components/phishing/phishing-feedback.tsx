import Link from "next/link";
import { CheckCircle2, CircleHelp } from "lucide-react";
import type { ResultadoPhishing } from "@/lib/phishing-api";
export function PhishingFeedback({
  resultado,
  escolha,
}: {
  resultado: ResultadoPhishing;
  escolha: boolean;
}) {
  return (
    <section
      className={`quiz-feedback ${resultado.acertou ? "is-correct" : ""}`}
    >
      <span className="activity-feedback-label">
        {resultado.acertou ? (
          <CheckCircle2 size={24} />
        ) : (
          <CircleHelp size={24} />
        )}
        {resultado.acertou ? "Boa análise!" : "Vamos observar os sinais."}
      </span>
      <h2 id="phishing-result-title" tabIndex={-1}>
        {resultado.acertou
          ? "Você identificou corretamente o cenário."
          : "Esta é uma oportunidade de aprender."}
      </h2>
      <p>
        Sua escolha:{" "}
        <strong>{escolha ? "É phishing" : "Não é phishing"}</strong>.
      </p>
      <p className="feedback-explanation">{resultado.explicacao}</p>
      <div className="activity-actions">
        <Link className="dashboard-button-primary" href="/simulacoes">
          Explorar outras simulações
        </Link>
      </div>
      <p className="activity-footnote">
        Tentativa registrada. O progresso da aula não foi alterado.
      </p>
    </section>
  );
}
