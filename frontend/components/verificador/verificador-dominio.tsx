"use client";
import { GooeyLoader } from '@/components/ui/gooey-loader'
import { useEffect, useRef, useState } from "react";
import { Search, Globe } from "lucide-react";
import { consultarDominio, type ConsultaDominio } from "@/lib/consulta-seguranca-api";
import { ActivityError } from "@/components/activities/activity-state";
import { DomainReport } from "./domain-report";
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
  return (
    <div className="verificador-layout domain-lab">
      <div className="domain-lab-main">
        <section className="activity-panel domain-workbench" aria-labelledby="domain-workbench-title">
          <div className="domain-workbench-heading">
            <span className="domain-eyebrow">Ponto de partida</span>
            <h2 id="domain-workbench-title">Investigue antes de confiar</h2>
            <p>Consulte um domínio público e aprenda a interpretar os sinais do relatório.</p>
          </div>
          <form onSubmit={submit} className="domain-form">
            <label htmlFor="dominio">Domínio para investigar</label>
            <div className="domain-search-row">
              <div className="domain-input-wrap">
                <Globe size={19} aria-hidden="true" />
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
                  aria-describedby="dominio-ajuda dominio-privacidade"
                />
              </div>
              <button
                type="submit"
                disabled={sending || !dominio.trim()}
                className="dashboard-button-primary"
              >
                {sending ? <GooeyLoader label="Carregando…" size={28} /> : <Search size={17} aria-hidden="true" />}
                {sending ? "Consultando..." : "Investigar domínio"}
              </button>
            </div>
            <p id="dominio-ajuda" className="domain-input-help">Digite somente o domínio, como exemplo.com, sem https://, portas ou caminhos.</p>
          </form>
          <p id="dominio-privacidade" className="domain-privacy">A consulta envia o domínio ao VirusTotal. Use apenas domínios públicos, sem informações confidenciais.</p>
        </section>

        {sending && (
          <div className="domain-loading" role="status">
            <GooeyLoader label="Carregando…" size={28} />
            <div><strong>Consultando o relatório de reputação</strong><p>Aguarde o retorno da integração com o VirusTotal.</p></div>
          </div>
        )}
        {error && <ActivityError error={error} />}
        {resultado && <DomainReport result={resultado} />}
        {!resultado && !sending && !error && (
          <section className="domain-blank" aria-labelledby="domain-blank-title">
            <span className="domain-blank-icon"><Search size={26} aria-hidden="true" /></span>
            <div>
              <h2 id="domain-blank-title">Cada endereço merece um olhar atento</h2>
              <p>Ao consultar, você verá a classificação e as detecções disponíveis, acompanhadas de uma explicação sobre o que elas significam.</p>
              <span>O relatório aparecerá aqui após a consulta.</span>
            </div>
          </section>
        )}
      </div>

      <aside className="domain-lab-guide" aria-label="Guia de investigação">
        <section className="domain-guide-intro">
          <span className="domain-eyebrow">Aprenda a observar</span>
          <h2>Um endereço pode enganar.</h2>
          <p>A reputação é uma pista. Combine o relatório com uma leitura atenta do endereço e da mensagem que o acompanha.</p>
        </section>
        <ol className="domain-guide-list">
          <li><strong>Confira cada letra</strong><p>Trocas sutis no nome podem imitar uma marca conhecida. Compare com um endereço oficial que você já conhece.</p></li>
          <li><strong>Desconfie da urgência</strong><p>Pedidos para agir rápido, informar senhas ou pagar imediatamente merecem uma confirmação por outro canal.</p></li>
          <li><strong>Observe o contexto</strong><p>Um resultado sem detecções não confirma que uma mensagem é legítima ou que uma página é confiável.</p></li>
        </ol>
        <section className="domain-scope-note">
          <h3>Domínio e URL são diferentes</h3>
          <p>Em <code>https://exemplo.com/conta</code>, o domínio é <code>exemplo.com</code>. É essa parte que a consulta atual verifica.</p>
        </section>
      </aside>
    </div>
  );
}
