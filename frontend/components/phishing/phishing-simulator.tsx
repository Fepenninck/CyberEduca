"use client";
import { useEffect, useRef, useState } from "react";
import { Mail, Shield, Search } from "lucide-react";
import "./phishing-environments.css";
import {
  enviarRespostaCenario,
  type CenarioDetalhe,
  type ResultadoPhishing,
} from "@/lib/phishing-api";
import { ActivityError } from "@/components/activities/activity-state";
import { PhishingEmail } from "./phishing-email";
import { PhishingSms } from "./phishing-sms";
import { PhishingSite } from "./phishing-site";
import { PhishingSocial } from "./phishing-social";
import { PhishingFeedback } from "./phishing-feedback";
export function PhishingSimulator({ cenario }: { cenario: CenarioDetalhe }) {
  const [escolha, setEscolha] = useState<boolean | null>(cenario.resultado?.respostaEhPhishing ?? null);
  const [resultado, setResultado] = useState<ResultadoPhishing | null>(cenario.resultado ?? null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const lock = useRef(false);
  const attemptId = useRef('');
  const [refazer, setRefazer] = useState(false);
  function startAgain() {
    if (lock.current) return;
    attemptId.current = crypto.randomUUID();
    setRefazer(true); setResultado(null); setEscolha(null); setError(null);
  }
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('refazer') === '1') startAgain();
  }, [cenario.id]);
  useEffect(() => {
    if (resultado) document.getElementById("phishing-result-title")?.focus();
  }, [resultado]);
  async function submit(answer: boolean) {
    if (lock.current) return;
    setEscolha(answer);
    lock.current = true;
    setSending(true);
    setError(null);
    try {
      if (!attemptId.current) attemptId.current = crypto.randomUUID();
      setResultado(await enviarRespostaCenario(cenario.id, answer, { refazer, tentativaId: attemptId.current }));
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
  const actions = <div className="phishing-mail-actions"><button type="button" disabled={sending} onClick={() => void submit(true)}><Shield size={16} />Denunciar como phishing</button><button type="button" disabled={sending} onClick={() => void submit(false)}>Manter como confiável</button></div>;
  return <div className={`phishing-environment phishing-environment-${cenario.tipo.toLowerCase()}`}>
    {resultado && escolha !== null ? <PhishingFeedback resultado={resultado} escolha={escolha} onRetry={startAgain} /> : <>
      {cenario.tipo === 'EMAIL' ? <div className="phishing-mail-app"><header><Mail size={22} /><strong>Correio</strong><span><Search size={15} />Pesquisar mensagens</span><small>ana@exemplo.invalid</small></header><div className="phishing-mail-layout"><aside><strong>Pastas</strong><span className="active">Caixa de entrada <b>1</b></span><span>Enviados</span><span>Rascunhos</span><span>Spam</span></aside><section><div className="phishing-mail-subject"><span>Caixa de entrada / mensagem recebida</span><h2>{cenario.titulo}</h2></div><Preview conteudo={cenario.conteudoMensagem} />{actions}</section></div></div>
      : cenario.tipo === 'SMS' ? <div className="phishing-message-desk"><div className="phishing-message-device"><Preview conteudo={cenario.conteudoMensagem} /><div className="phishing-device-actions">{actions}</div></div><aside><h2>Uma mensagem acabou de chegar.</h2><p>Abra os links dentro da conversa e confira o pedido antes de decidir o que fazer com a mensagem.</p><small>Celular de demonstração. Nenhum link abre fora deste ambiente.</small></aside></div>
      : cenario.tipo === 'REDE_SOCIAL' ? <div className="phishing-social-app"><header><strong>Conecta</strong><span>Início</span><span>Mensagens</span><small>Ana Exemplo</small></header><div className="phishing-social-layout"><aside><span>Meu perfil</span><span>Contatos</span><span>Mensagens recebidas</span></aside><section><Preview conteudo={cenario.conteudoMensagem} />{actions}</section></div></div>
      : <div className="phishing-browser-app"><header><span className="phishing-browser-tab">Página recebida</span><small>Navegador de demonstração</small></header><Preview conteudo={cenario.conteudoMensagem} /><footer><span>Como deseja tratar esta página?</span>{actions}</footer></div>}
      {error && <ActivityError error={error} />}
      {sending && <p role="status" className="phishing-save-status">Registrando sua ação…</p>}
      <p className="phishing-scene-note">Conteúdo fictício. Links, anexos e dados funcionam apenas nesta simulação.</p>
    </>}
  </div>;
}
