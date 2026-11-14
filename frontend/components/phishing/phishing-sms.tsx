import { PhishingInteractiveContent } from "./phishing-interactive-content";
import { ChevronLeft, MessageSquare } from "lucide-react";
export function PhishingSms({ conteudo }: { conteudo: string }) {
  return (
    <div className="simulation-phone">
      <div className="simulation-phone-speaker" />
      <div className="simulation-toolbar">
        <ChevronLeft size={18} />
        <span>Mensagens</span>
        <MessageSquare size={18} />
      </div>
      <p className="simulation-time">Mensagem do cenário</p>
      <div className="simulation-bubble simulation-message"><PhishingInteractiveContent content={conteudo} /></div>
      <div className="simulation-phone-bottom" />
    </div>
  );
}
