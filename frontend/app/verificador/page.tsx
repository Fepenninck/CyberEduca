import { ActivityShell } from "@/components/activities/activity-shell";
import { VerificadorDominio } from "@/components/verificador/verificador-dominio";
export default function VerificadorPage() {
  return (
    <ActivityShell
      section="verificador"
      title="Antes de acessar, verifique."
      description="Consulte a reputação de um domínio e entenda os sinais encontrados pelos mecanismos de segurança."
    >
      <VerificadorDominio />
    </ActivityShell>
  );
}
