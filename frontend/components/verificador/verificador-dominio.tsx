"use client";
import { useEffect, useRef, useState } from "react";
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  CircleHelp,
  Globe,
} from "lucide-react";
import {
  consultarDominio,
  type ConsultaDominio,
} from "@/lib/consulta-seguranca-api";
import { ActivityError } from "@/components/activities/activity-state";
const resultados = {
  SEM_DETECCOES: {
    title: "Nenhuma detecção no relatório",
    text: "Os mecanismos consultados não apontaram detecções maliciosas ou suspeitas. Isso não garante que o domínio seja seguro.",
    icon: ShieldCheck,
    className: "is-correct",
  },
  SUSPEITO: {
    title: "Domínio com sinais suspeitos",
    text: "Há mecanismos que classificam este domínio como suspeito. Confira a origem e evite informar dados pessoais.",
    icon: ShieldAlert,
    className: "",
  },
  MALICIOSO: {
    title: "Detecções maliciosas encontradas",
    text: "Um ou mais mecanismos sinalizaram este domínio como malicioso. Evite acessá-lo ou fornecer informações.",
    icon: ShieldAlert,
    className: "is-danger",
  },
  SEM_DADOS: {
    title: "Dados insuficientes para avaliar",
    text: "Não há avaliações suficientes no relatório consultado. Ausência de dados não significa que o domínio seja confiável.",
    icon: CircleHelp,
    className: "",
  },
};
export function VerificadorDominio() {
  const [dominio, setDominio] = useState("");
  const [resultado, setResultado] = useState<ConsultaDominio | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [sending, setSending] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    if (resultado) document.getElementById("domain-result-title")?.focus();
  }, [resultado]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    const value = dominio.trim();
    setError(null);
    setResultado(null);
    if (!value || /[\s/:\\?#@%]/.test(value) || !value.includes(".")) {
      setError(
        new Error(
          "Informe somente o domínio, como exemplo.com, sem https://, portas ou caminhos.",
        ),
      );
      return;
    }
    lock.current = true;
    setSending(true);
    try {
      setResultado(await consultarDominio(value));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause
          : new Error("Não foi possível consultar o domínio."),
      );
    } finally {
      lock.current = false;
      setSending(false);
    }
  }
  const info = resultado ? resultados[resultado.resultado] : null;
  const Icon = info?.icon || ShieldCheck;
  return (
    <div className="verificador-layout">
      <div>
        <section className="activity-panel">
          <div className="activity-card-icon">
            <Search size={26} />
          </div>
          <h2>Consultar um domínio</h2>
          <p className="activity-muted">
            Informe o endereço que você quer analisar.
          </p>
          <form onSubmit={submit} className="domain-form">
            <label htmlFor="dominio">Domínio</label>
            <div className="domain-input-wrap">
              <Globe size={19} />
              <input
                id="dominio"
                value={dominio}
                onChange={(event) => {
                  setDominio(event.target.value);
                  setResultado(null);
                  setError(null);
                }}
                placeholder="exemplo.com"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                maxLength={253}
                required
                disabled={sending}
                aria-describedby="dominio-ajuda"
              />
            </div>
            <p id="dominio-ajuda" className="activity-footnote">
              Digite apenas o domínio, sem https:// ou caminhos.
            </p>
            <button
              type="submit"
              disabled={sending || !dominio.trim()}
              className="dashboard-button-primary"
            >
              <Search size={17} />
              {sending ? "Consultando reputação..." : "Verificar domínio"}
            </button>
          </form>
          <p className="activity-footnote">
            A consulta envia o domínio ao VirusTotal. Utilize apenas domínios
            públicos, sem informações confidenciais.
          </p>
        </section>
        {sending && (
          <p className="activity-loading-line" role="status">
            Consultando os mecanismos de segurança...
          </p>
        )}
        {error && <ActivityError error={error} />}
        {resultado && info && (
          <section className={`quiz-feedback domain-result ${info.className}`}>
            <span className="activity-feedback-label">
              <Icon size={25} /> RELATÓRIO DE REPUTAÇÃO
            </span>
            <h2 id="domain-result-title" tabIndex={-1}>
              {info.title}
            </h2>
            <p className="domain-name">{resultado.dominio}</p>
            <p>{info.text}</p>
            <div className="domain-metrics">
              <div>
                <span>Maliciosas</span>
                <strong>
                  {resultado.resultado === "SEM_DADOS"
                    ? "—"
                    : resultado.deteccoesMaliciosas}
                </strong>
              </div>
              <div>
                <span>Suspeitas</span>
                <strong>
                  {resultado.resultado === "SEM_DADOS"
                    ? "—"
                    : resultado.deteccoesSuspeitas}
                </strong>
              </div>
            </div>
            <p className="activity-footnote">
              Fonte: VirusTotal · Consultado em{" "}
              {new Date(resultado.consultadoEm).toLocaleString("pt-BR")}
            </p>
            <p className="activity-footnote">
              O relatório pode refletir análises anteriores e não substitui
              outros cuidados de navegação.
            </p>
          </section>
        )}
      </div>
      <aside className="activity-panel domain-tips">
        <span className="activity-kicker">NAVEGUE COM ATENÇÃO</span>
        <h2>Um endereço pode enganar.</h2>
        <ol>
          <li>
            <strong>Confira cada letra</strong>
            <p>Trocas sutis no nome podem imitar uma marca conhecida.</p>
          </li>
          <li>
            <strong>Desconfie da urgência</strong>
            <p>
              Pressão para agir rápido é um sinal comum de engenharia social.
            </p>
          </li>
          <li>
            <strong>Use canais oficiais</strong>
            <p>
              Na dúvida, procure a organização por um endereço que você já
              conhece.
            </p>
          </li>
        </ol>
      </aside>
    </div>
  );
}
