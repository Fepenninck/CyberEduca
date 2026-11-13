"use client";
import Link from "next/link";
import {
  Home,
  BookOpen,
  MonitorPlay,
  ClipboardCheck,
  ShieldCheck,
  ListChecks,
  Menu,
} from "lucide-react";
import { UserMenu } from "@/components/user-menu";
const items = [
  { key: "inicio", href: "/dashboard", label: "Início", icon: Home },
  { key: "aulas", href: "/aulas", label: "Trilhas", icon: BookOpen },
  {
    key: "simulacoes",
    href: "/simulacoes",
    label: "Simulações",
    icon: MonitorPlay,
  },
  { key: "quizzes", href: "/quizzes", label: "Quizzes", icon: ListChecks },
  {
    key: "avaliacoes",
    href: "/avaliacoes",
    label: "Avaliações",
    icon: ClipboardCheck,
  },
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
      <item.icon size={16} />
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
          <nav>
            {links}
            <Link href="/perfil">Meu perfil</Link>
            <Link href="/configuracoes">
              Configurações
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
