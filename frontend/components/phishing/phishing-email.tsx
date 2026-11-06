import { Mail, MoreHorizontal } from "lucide-react";
export function PhishingEmail({ conteudo }: { conteudo: string }) {
  return (
    <div className="simulation-window">
      <div className="simulation-toolbar">
        <Mail size={18} />
        <span>Caixa de entrada</span>
        <MoreHorizontal size={20} />
      </div>
      <div className="simulation-email-header">
        <span className="simulation-avatar">@</span>
        <div>
          <strong>Mensagem recebida</strong>
          <small>Analise as informações apresentadas abaixo</small>
        </div>
      </div>
      <div className="simulation-message">{conteudo}</div>
    </div>
  );
}
