import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DashboardNavigation } from "@/components/dashboard-navigation";
import type { ReactNode } from "react";
import "./activities.css";
import { SimulationBack } from './simulation-back';

export function ActivityShell({
  section,
  title,
  description,
  children,
  back,
  resumo,
}: {
  section: "quizzes" | "simulacoes" | "verificador" | "avaliacoes" | "aulas";
  title: string;
  description: string;
  children: ReactNode;
  back?: string;
  resumo?: ReactNode;
}) {
  return (
    <main className={`app-shell dashboard-page activity-page ${section}-page`}>
      <DashboardNavigation active={section} />
      <div className="dashboard-wrap">
        {back && (section === 'simulacoes' ? <SimulationBack href={back} /> : (
          <Link className={section === 'quizzes' || section === 'avaliacoes' || section === 'aulas' ? 'simulation-back-button' : 'activity-back'} href={back}>
            <ArrowLeft size={16} aria-hidden="true" /> {section === 'quizzes' ? 'Voltar aos quizzes' : section === 'aulas' ? 'Voltar às trilhas' : section === 'avaliacoes' ? 'Voltar às avaliações' : 'Voltar à lista'}
          </Link>
        ))}
        <header className={`dashboard-welcome activity-heading${resumo ? " has-summary" : ""}`}>
          <div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          {resumo && <div className="activity-summary">{resumo}</div>}
        </header>
        {children}
      </div>
    </main>
  );
}
