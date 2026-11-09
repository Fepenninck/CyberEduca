import Link from "next/link";
import { ActivityShell } from "@/components/activities/activity-shell";
export default function AvaliacoesPage() {
  return <ActivityShell section="avaliacoes" title="Avaliações" description="As provas serão disponibilizadas pelo módulo de avaliações.">
    <p>Enquanto isso, pratique com os <Link href="/quizzes">quizzes educativos</Link>. Suas tentativas são registradas na sua conta.</p>
  </ActivityShell>;
}
