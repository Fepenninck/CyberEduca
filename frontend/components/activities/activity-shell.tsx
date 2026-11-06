import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DashboardNavigation } from "@/components/dashboard-navigation";
import type { ReactNode } from "react";
import "./activities.css";

export function ActivityShell({
  section,
  title,
  description,
  children,
  back,
}: {
  section: "quizzes" | "simulacoes" | "verificador" | "avaliacoes";
  title: string;
  description: string;
  children: ReactNode;
  back?: string;
}) {
  return (
    <main className="app-shell dashboard-page activity-page">
      <DashboardNavigation active={section} />
      <div className="dashboard-wrap">
        {back && (
          <Link className="activity-back" href={back}>
            <ArrowLeft size={16} /> Voltar à lista
          </Link>
        )}
        <header className="dashboard-welcome activity-heading">
          <span className="dashboard-eyebrow">APRENDA NA PRÁTICA</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </header>
        {children}
      </div>
    </main>
  );
}
