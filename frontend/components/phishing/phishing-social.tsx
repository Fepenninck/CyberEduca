import { PhishingInteractiveContent } from "./phishing-interactive-content";
import { UserRound, MoreHorizontal } from "lucide-react";
export function PhishingSocial({ conteudo }: { conteudo: string }) {
  return (
    <div className="simulation-window">
      <div className="simulation-toolbar">
        <span className="simulation-avatar">
          <UserRound size={20} />
        </span>
        <span>Publicação do cenário</span>
        <MoreHorizontal size={20} />
      </div>
      <div className="simulation-message"><PhishingInteractiveContent content={conteudo} /></div>
      <div className="simulation-social-footer">
        Publicação simulada para análise
      </div>
    </div>
  );
}
