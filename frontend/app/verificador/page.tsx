import { ActivityShell } from "@/components/activities/activity-shell";
import { VerificadorDominio } from "@/components/verificador/verificador-dominio";
export default function VerificadorPage() {
  return (
    <ActivityShell
      section="verificador"
      title="Laboratório de investigação de links"
      description="Investigue a reputação de um domínio, interprete as evidências disponíveis e aprenda a reconhecer os limites de uma análise de segurança."
    >
      <VerificadorDominio />
    </ActivityShell>
  );
}
