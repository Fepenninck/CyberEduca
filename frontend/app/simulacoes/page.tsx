"use client";
import Link from "next/link";
import { useCallback, useState } from "react";
import { ArrowUpRight, Mail, MessageSquare, Globe, Users } from "lucide-react";
import {
  listarCenarios,
  nomesTipos,
  type TipoCenario,
} from "@/lib/phishing-api";
import { ActivityShell } from "@/components/activities/activity-shell";
import {
  ActivityEmpty,
  ActivityError,
  ActivityLoading,
} from "@/components/activities/activity-state";
import { useActivity } from "@/components/activities/use-activity";
const icons = {
  EMAIL: Mail,
  SMS: MessageSquare,
  SITE: Globe,
  REDE_SOCIAL: Users,
};
export default function SimulacoesPage() {
  const [tipo, setTipo] = useState<TipoCenario | "TODOS">("TODOS");
  const loader = useCallback(
    (signal: AbortSignal) =>
      listarCenarios(
        new URLSearchParams(window.location.search).get("aulaId") || undefined,
        signal,
      ),
    [],
  );
  const { data, error, loading, retry } = useActivity(loader);
  const cenarios = data?.filter(
    (cenario) => tipo === "TODOS" || cenario.tipo === tipo,
  );
  return (
    <ActivityShell
      section="simulacoes"
      title="Um olhar atento faz a diferença."
      description="E-mail, SMS, sites e redes sociais: pratique como reconhecer tentativas de phishing em um ambiente de aprendizagem."
    >
      <div className="activity-filter" aria-label="Filtrar por tipo de cenário">
        {(["TODOS", "EMAIL", "SMS", "SITE", "REDE_SOCIAL"] as const).map(
          (value) => (
            <button
              key={value}
              aria-pressed={tipo === value}
              onClick={() => setTipo(value)}
            >
              {value === "TODOS" ? "Todos os cenários" : nomesTipos[value]}
            </button>
          ),
        )}
      </div>
      {loading ? (
        <ActivityLoading />
      ) : error ? (
        <ActivityError error={error} retry={retry} />
      ) : cenarios?.length ? (
        <div className="activity-grid">
          {cenarios.map((cenario) => {
            const Icon = icons[cenario.tipo];
            return (
              <article key={cenario.id} className="activity-card">
                <div className="activity-card-icon blue">
                  <Icon size={26} />
                </div>
                <span className="activity-kicker">
                  {nomesTipos[cenario.tipo]}
                </span>
                <h2>{cenario.titulo}</h2>
                <p>{cenario.descricao}</p>
                <span className="activity-lesson">{cenario.aula.titulo}</span>
                {!!cenario.tentativas?.length && <span className="activity-kicker">Simulação concluída</span>}
                <Link
                  className="activity-card-link"
                  href={`/simulacoes/${cenario.id}`}
                >
                  {cenario.tentativas?.length ? 'Ver resultado' : 'Iniciar simulação'} <ArrowUpRight size={18} />
                  <span className="sr-only">: {cenario.titulo}</span>
                </Link>
              </article>
            );
          })}
        </div>
      ) : (
        <ActivityEmpty>
          {data?.length
            ? "Nenhum cenário deste tipo. Experimente outro filtro."
            : "Os cenários aparecerão aqui assim que forem publicados."}
        </ActivityEmpty>
      )}
    </ActivityShell>
  );
}
