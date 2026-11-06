"use client";
import { useEffect, useRef, useState } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import {
  enviarRespostaCenario,
  nomesTipos,
  type CenarioDetalhe,
  type ResultadoPhishing,
} from "@/lib/phishing-api";
import { ActivityError } from "@/components/activities/activity-state";
import { PhishingEmail } from "./phishing-email";
import { PhishingSms } from "./phishing-sms";
import { PhishingSite } from "./phishing-site";
import { PhishingSocial } from "./phishing-social";
import { PhishingFeedback } from "./phishing-feedback";
import { localScenarios } from "@/lib/library-activities";
export function PhishingSimulator({ cenario }: { cenario: CenarioDetalhe }) {
  const [escolha, setEscolha] = useState<boolean | null>(null);
  const [resultado, setResultado] = useState<ResultadoPhishing | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const lock = useRef(false);
  useEffect(() => {
    if (resultado) document.getElementById("phishing-result-title")?.focus();
  }, [resultado]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (lock.current || escolha === null) return;
    lock.current = true;
    setSending(true);
    setError(null);
    try {
      const local = localScenarios.find((s) => s.id === cenario.id);
      if (local) {
        const result = {
          tentativaId: `local-${Date.now()}`,
          cenarioId: cenario.id,
          acertou: escolha === local.phishing,
          concluido: true,
          progressoAtualizado: false,
          explicacao: local.explanation,
        };
        try {
          localStorage.setItem(
            `cybereduca-simulation-${cenario.id}`,
            JSON.stringify(result),
          );
        } catch {
          /* Correção disponível mesmo sem armazenamento. */
        }
        setResultado(result);
        return;
      }
      setResultado(await enviarRespostaCenario(cenario.id, escolha));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause
          : new Error("Não foi possível registrar sua resposta."),
      );
    } finally {
      lock.current = false;
      setSending(false);
    }
  }
  const Preview = {
    EMAIL: PhishingEmail,
    SMS: PhishingSms,
    SITE: PhishingSite,
    REDE_SOCIAL: PhishingSocial,
  }[cenario.tipo];
  return (
    <div className="simulation-layout">
      <section className="activity-panel simulation-preview">
        <div className="activity-section-label">
          <h2>{nomesTipos[cenario.tipo]}</h2>
          <span className="activity-tag">SIMULAÇÃO</span>
        </div>
        <Preview conteudo={cenario.conteudoMensagem} />
        <p className="activity-footnote">
          O conteúdo é uma representação educativa. Endereços e links são
          apresentados apenas como texto.
        </p>
      </section>
      <aside className="simulation-decision">
        {resultado && escolha !== null ? (
          <PhishingFeedback
            resultado={resultado}
            escolha={escolha}
            restart={() => {
              setResultado(null);
              setEscolha(null);
              setError(null);
            }}
          />
        ) : (
          <form className="activity-panel" onSubmit={submit}>
            <span className="activity-kicker">SUA ANÁLISE</span>
            <h2>Você identifica phishing?</h2>
            <p className="activity-muted">
              Observe o conteúdo, a urgência e os pedidos da mensagem antes de
              responder.
            </p>
            <fieldset disabled={sending} className="simulation-choices">
              <legend className="sr-only">Classifique o cenário</legend>
              <label className={escolha === true ? "is-selected" : ""}>
                <input
                  type="radio"
                  name="phishing"
                  checked={escolha === true}
                  onChange={() => setEscolha(true)}
                  required
                />
                <ShieldAlert size={21} />
                <span>É phishing</span>
              </label>
              <label className={escolha === false ? "is-selected" : ""}>
                <input
                  type="radio"
                  name="phishing"
                  checked={escolha === false}
                  onChange={() => setEscolha(false)}
                  required
                />
                <ShieldCheck size={21} />
                <span>Não é phishing</span>
              </label>
            </fieldset>
            {error && <ActivityError error={error} />}
            <button
              className="dashboard-button-primary"
              type="submit"
              disabled={sending || escolha === null}
            >
              {sending ? "Registrando..." : "Confirmar resposta"}
            </button>
          </form>
        )}
      </aside>
    </div>
  );
}
