"use client";
import Link from "next/link";
import {
  Home,
  Route,
  MonitorPlay,
  ShieldCheck,
  ListChecks,
  Menu,
} from "lucide-react";
import { UserMenu } from "@/components/user-menu";
const items = [
  { key: "inicio", href: "/dashboard", label: "Início", icon: Home },
  { key: "aulas", href: "/aulas", label: "Trilhas", icon: Route },
  {
    key: "simulacoes",
    href: "/simulacoes",
    label: "Simulações",
    icon: MonitorPlay,
  },
  { key: "quizzes", href: "/quizzes", label: "Quizzes", icon: ListChecks },
  {
    key: "verificador",
    href: "/verificador",
    label: "Laboratório",
    icon: ShieldCheck,
  },
] as const;
export function DashboardNavigation({
  active,
}: {
  active?:
    | "aulas"
    | "simulacoes"
    | "quizzes"
    | "avaliacoes"
    | "verificador"
    | "perfil"
    | "inicio";
}) {
  const links = items.map((item) => (
    <Link
      key={item.key}
      className={active === item.key ? "is-active" : undefined}
      aria-current={active === item.key ? "page" : undefined}
      href={item.href}
    >
      {item.key === 'aulas' ? <i className="dashboard-trails-icon" aria-hidden="true" /> : <item.icon size={18} aria-hidden="true" />}
      {item.label}
    </Link>
  ));
  return (
    <header className="dashboard-header">
      <div className="dashboard-header-inner">
        <Link
          href="/dashboard"
          className="dashboard-brand"
          aria-label="CyberEduca+ início"
        >
          <img src="/cybereduca-logo.png" alt="CyberEduca+" />
        </Link>
        <nav className="dashboard-nav" aria-label="Navegação principal">
          {links}
        </nav>
        <div className="dashboard-header-actions">
          <UserMenu />
        </div>
        <details className="dashboard-mobile-menu">
          <summary aria-label="Abrir navegação">
            <Menu size={24} />
          </summary>
          <nav aria-label="Navegação mobile" onClick={event => {
            if ((event.target as HTMLElement).closest('a')) {
              const menu = event.currentTarget.closest('details');
              if (menu) menu.open = false;
            }
          }} onKeyDown={event => {
            if (event.key === 'Escape') {
              const menu = event.currentTarget.closest('details');
              if (menu) { menu.open = false; menu.querySelector('summary')?.focus(); }
            }
          }}>
            {links}
            <UserMenu mobile />
          </nav>
        </details>
      </div>
    </header>
  );
}
