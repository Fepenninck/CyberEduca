import { Globe, MoreHorizontal } from "lucide-react";
export function PhishingSite({ conteudo }: { conteudo: string }) {
  return (
    <div className="simulation-window">
      <div className="simulation-toolbar">
        <div className="simulation-dots">
          <i />
          <i />
          <i />
        </div>
        <span className="simulation-address">
          <Globe size={14} /> Prévia de página · simulação
        </span>
        <MoreHorizontal size={18} />
      </div>
      <div className="simulation-message simulation-site-body">{conteudo}</div>
    </div>
  );
}
