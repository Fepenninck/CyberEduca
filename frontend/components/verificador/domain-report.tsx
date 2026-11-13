import { CircleHelp, ShieldAlert, ShieldCheck } from "lucide-react";
import type { ConsultaDominio } from "@/lib/consulta-seguranca-api";

const classifications = {
  SEM_DETECCOES: {
    label: "Sem detecções",
    title: "Nenhuma detecção no relatório consultado",
    description:
      "Os mecanismos consultados não apontaram classificações maliciosas ou suspeitas. Esse resultado não garante que o domínio seja seguro.",
    lesson:
      "Um endereço pode ser recente ou ainda não ter sido identificado pelos mecanismos de segurança. A ausência de detecções é uma informação do relatório, não uma autorização para confiar no site.",
    advice:
      "Confira a grafia do domínio e a origem da mensagem. Antes de informar uma senha ou fazer um pagamento, acesse a organização por um endereço que você já conhece.",
    icon: ShieldCheck,
  },
  SUSPEITO: {
    label: "Sinais suspeitos",
    title: "O domínio merece atenção",
    description:
      "Há mecanismos que classificam este domínio como suspeito. A classificação indica um possível risco e pede uma verificação cuidadosa da origem do endereço.",
    lesson:
      "Uma classificação suspeita é um sinal de alerta. Ela não explica, por si só, qual comportamento foi identificado nem confirma que uma tentativa de golpe aconteceu.",
    advice:
      "Evite informar dados pessoais ou baixar arquivos. Confirme a mensagem por outro canal e procure o endereço oficial da organização de forma independente.",
    icon: ShieldAlert,
  },
  MALICIOSO: {
    label: "Detecções maliciosas",
    title: "Mecanismos sinalizaram este domínio como malicioso",
    description:
      "O relatório contém uma ou mais classificações maliciosas. Trate o endereço com cautela e evite acessá-lo ou fornecer informações.",
    lesson:
      "Uma detecção maliciosa significa que um mecanismo classificou o domínio dessa forma. Os dados disponíveis aqui não detalham o tipo de ameaça nem comprovam que seu dispositivo foi afetado.",
    advice:
      "Não forneça senhas, dados bancários ou códigos de acesso nesse endereço. Se ele chegou em uma mensagem, verifique o pedido diretamente com a organização por um canal conhecido.",
    icon: ShieldAlert,
  },
  SEM_DADOS: {
    label: "Análise inconclusiva",
    title: "Não há dados suficientes para avaliar",
    description:
      "O relatório consultado não oferece avaliações suficientes para uma conclusão. Ausência de dados não significa que o domínio seja confiável.",
    lesson:
      "Um resultado inconclusivo não equivale a zero risco. As contagens aparecem como indisponíveis porque o relatório não permite interpretá-las como ausência de detecções.",
    advice:
      "Confira a origem do endereço e a grafia do domínio. Na dúvida, procure a organização por um canal oficial antes de abrir o site ou compartilhar informações.",
    icon: CircleHelp,
  },
} satisfies Record<ConsultaDominio["resultado"], {
  label: string;
  title: string;
  description: string;
  lesson: string;
  advice: string;
  icon: typeof ShieldCheck;
}>;

export function DomainReport({ result }: { result: ConsultaDominio }) {
  const classification = classifications[result.resultado];
  const Icon = classification.icon;
  const insufficient = result.resultado === "SEM_DADOS";

  return (
    <section className="domain-report" data-state={result.resultado} aria-labelledby="domain-result-title">
      <header className="domain-report-header">
        <span className="domain-eyebrow">Relatório de investigação</span>
        <span className="domain-classification"><Icon size={16} aria-hidden="true" />{classification.label}</span>
      </header>

      <div className="domain-verdict">
        <span className="domain-verdict-icon"><Icon size={26} aria-hidden="true" /></span>
        <div>
          <h2 id="domain-result-title" tabIndex={-1}>{classification.title}</h2>
          <p>{classification.description}</p>
        </div>
      </div>

      <dl className="domain-report-facts">
        <div><dt>Domínio consultado</dt><dd className="domain-address">{result.dominio}</dd></div>
        <div><dt>Fonte do relatório</dt><dd>VirusTotal</dd></div>
        <div><dt>Consulta registrada em</dt><dd><time dateTime={result.consultadoEm}>{new Date(result.consultadoEm).toLocaleString("pt-BR")}</time></dd></div>
      </dl>

      <section className="domain-evidence" aria-labelledby="domain-evidence-title">
        <div className="domain-section-heading">
          <h3 id="domain-evidence-title">O que os mecanismos apontaram</h3>
          <p>São classificações retornadas pelo relatório consultado.</p>
        </div>
        <dl className="domain-detections">
          <div className="domain-detection malicious">
            <dt>Detecções maliciosas</dt>
            <dd>
              <span className="domain-detection-count">{insufficient ? <span role="img" aria-label="Não disponível">—</span> : result.deteccoesMaliciosas}</span>
              <p>Mecanismos que classificaram o domínio como malicioso.</p>
            </dd>
          </div>
          <div className="domain-detection suspicious">
            <dt>Detecções suspeitas</dt>
            <dd>
              <span className="domain-detection-count">{insufficient ? <span role="img" aria-label="Não disponível">—</span> : result.deteccoesSuspeitas}</span>
              <p>Mecanismos que sinalizaram um possível risco no domínio.</p>
            </dd>
          </div>
        </dl>
        <p className="domain-evidence-note">Uma detecção é a classificação de um mecanismo, não uma contagem de ataques. Os mecanismos podem usar critérios diferentes.</p>
      </section>

      <section className="domain-learning" aria-labelledby="domain-learning-title">
        <div>
          <span className="domain-eyebrow">Entenda o resultado</span>
          <h3 id="domain-learning-title">O que você pode aprender com esta análise</h3>
          <p>{classification.lesson}</p>
        </div>
        <div className="domain-next-step">
          <h3>Como agir com mais segurança</h3>
          <p>{classification.advice}</p>
        </div>
      </section>

      <footer className="domain-report-limit">
        <strong>Os limites deste relatório</strong>
        <p>A consulta verifica a reputação do domínio. Ela não avalia um caminho específico de uma URL, arquivos ou o conteúdo de uma página. O relatório pode refletir análises anteriores; a data acima indica o momento da consulta, não a data da última análise dos mecanismos.</p>
      </footer>
    </section>
  );
}
