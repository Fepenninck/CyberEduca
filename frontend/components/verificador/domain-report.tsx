import type { ConsultaDominio } from "@/lib/consulta-seguranca-api";

const classifications = {
  SEM_DETECCOES: {
    label: "Sem detecções",
    title: "Bom sinal: nenhum alerta encontrado",
    description:
      "As ferramentas consultadas não classificaram este domínio como suspeito ou malicioso. O resultado é favorável nesta consulta.",
    steps: [
      { title: "Veja se é o site que você procurava.", detail: "Confira se {dominio} corresponde ao endereço que você já conhece ou usa no dia a dia." },
      { title: "Confirme pedidos de dados ou pagamentos.", detail: "Se o link veio por mensagem, confira a solicitação no aplicativo oficial. A reputação do domínio não confirma quem enviou a mensagem." },
    ],
  },
  SUSPEITO: {
    label: "Sinais suspeitos",
    title: "O domínio merece atenção",
    description:
      "Há sinais de risco. Feche a página e confirme o pedido pelo aplicativo ou atendimento oficial antes de continuar.",
    steps: [
      { title: "Pause o acesso.", detail: "Feche a aba de {dominio}. Não preencha formulários, faça pagamentos ou baixe arquivos." },
      { title: "Confira por outro canal.", detail: "Abra o aplicativo oficial para verificar a cobrança. Se a mensagem veio de alguém conhecido, ligue para o número já salvo." },
      { title: "Sem confirmação, não continue.", detail: "Mostre a mensagem e este resultado ao professor ou ao suporte oficial antes de usar o link." },
    ],
  },
  MALICIOSO: {
    label: "Detecções maliciosas",
    title: "Mecanismos sinalizaram este domínio como malicioso",
    description:
      "O domínio recebeu alertas de conteúdo malicioso. Evite acessá-lo, enviar dados ou baixar arquivos.",
    steps: [
      { title: "Interrompa o acesso.", detail: "Feche {dominio}. Se recebeu o link por mensagem, use a opção de denunciar spam ou phishing." },
      { title: "Não abra arquivos baixados.", detail: "Se já executou ou instalou algo, informe ao suporte de TI o nome do arquivo e o que fez." },
      { title: "Procure o atendimento oficial.", detail: "Use o aplicativo da empresa para relatar o link. Não use telefones ou chats da página sinalizada." },
    ],
  },
  SEM_DADOS: {
    label: "Análise inconclusiva",
    title: "Não há dados suficientes para avaliar",
    description:
      "Não foi possível avaliar o domínio. Confirme sua origem antes de abrir o link ou informar dados.",
    steps: [
      { title: "Aguarde antes de agir.", detail: "Não informe senhas, baixe arquivos ou pague usando um endereço cuja origem você ainda não confirmou." },
      { title: "Confirme quem enviou o link.", detail: "Ligue para um contato já salvo e pergunte se a pessoa enviou {dominio} e para quê." },
      { title: "Use um caminho conhecido.", detail: "Prefira o aplicativo oficial ou um favorito salvo. Se não souber qual usar, peça ajuda ao professor." },
    ],
  },
} satisfies Record<ConsultaDominio["resultado"], {
  label: string;
  title: string;
  description: string;
  steps: Array<{ title: string; detail: string }>;
}>;

export function DomainReport({ result }: { result: ConsultaDominio }) {
  const classification = classifications[result.resultado];
  const insufficient = result.resultado === "SEM_DADOS";

  return (
    <section className="domain-report" data-state={result.resultado} aria-labelledby="domain-result-title">
      <header className="domain-report-header">
        <div><span className="domain-eyebrow">Relatório de investigação</span><p className="domain-report-domain">{result.dominio}</p></div>
        <span className="domain-classification">{classification.label}</span>
      </header>

      <section className="domain-evidence" aria-labelledby="domain-evidence-title">
        <div className="domain-section-heading">
          <h3 id="domain-evidence-title">Alertas encontrados</h3>
        </div>
        <dl className="domain-detections">
          <div className="domain-detection malicious">
            <dt>Detecções maliciosas</dt>
            <dd>
              <span className="domain-detection-count">{insufficient ? <span role="img" aria-label="Não disponível">-</span> : result.deteccoesMaliciosas}</span>
            </dd>
          </div>
          <div className="domain-detection suspicious">
            <dt>Detecções suspeitas</dt>
            <dd>
              <span className="domain-detection-count">{insufficient ? <span role="img" aria-label="Não disponível">-</span> : result.deteccoesSuspeitas}</span>
            </dd>
          </div>
        </dl>
      </section>

      <div className="domain-verdict">
        <div>
          <h2 id="domain-result-title" tabIndex={-1}>{classification.title}</h2>
          <p>{classification.description}</p>
        </div>
      </div>

      <section className="domain-next-step" aria-labelledby="domain-next-step-title">
        <h3 id="domain-next-step-title">{result.resultado === "SEM_DETECCOES" ? "Antes de continuar" : "O que fazer agora"}</h3>
        <ol>{classification.steps.map(step => <li key={step.title}><strong>{step.title}</strong><span>{step.detail.replaceAll('{dominio}', result.dominio)}</span></li>)}</ol>
        {(result.resultado === "SUSPEITO" || result.resultado === "MALICIOSO") && <p className="domain-already-interacted"><strong>Já enviou dados?</strong> Se informou uma senha, troque-a no serviço oficial e nas contas em que a repetiu. Se pagou ou enviou dados do cartão, contate seu banco pelo aplicativo oficial.</p>}
      </section>

      <footer className="domain-report-meta">
        <span>Fonte: VirusTotal</span>
        <span>Consultado em <time dateTime={result.consultadoEm}>{new Date(result.consultadoEm).toLocaleString("pt-BR")}</time></span>
      </footer>
    </section>
  );
}
