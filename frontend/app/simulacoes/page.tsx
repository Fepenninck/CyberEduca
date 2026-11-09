"use client";
import { ArrowRight, FolderOpen, MonitorPlay } from 'lucide-react'
import { useEffect } from 'react'
import { listarCategoriasSimulacao, type CategoriaSimulacaoDisponivel } from '@/lib/simulacoes-api'
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
      <CategoriasSimulacao />
      <div className="activity-section-label">
        <h2>Cenários publicados na sua conta</h2>
      </div>
      <div className="activity-banner">
        <Mail size={25} />
        <div>
          <strong>Observe. Questione. Decida.</strong>
          <p>
            Analise cada mensagem e descubra quais sinais merecem sua atenção.
          </p>
        </div>
        <span className="activity-tag">AMBIENTE SIMULADO</span>
      </div>
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
                <Link
                  className="activity-card-link"
                  href={`/simulacoes/${cenario.id}`}
                >
                  Iniciar simulação <ArrowUpRight size={18} />
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




function CategoriasSimulacao() {
  const [categorias, setCategorias] = useState<CategoriaSimulacaoDisponivel[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    listarCategoriasSimulacao()
      .then((dados) => { if (ativo) setCategorias(dados) })
      .catch((falha: unknown) => { if (ativo) setErro(falha instanceof Error ? falha.message : 'Não foi possível carregar as categorias.') })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [])

  return (
    <div>

      <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-12">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b2ff00]">Pratique no seu ritmo</p>
          <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-white"><MonitorPlay className="text-[#b2ff00]" /> Simulações</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Escolha um tema para explorar os cenários de treino. As simulações não valem nota.</p>
        </header>

        {erro && <p role="alert" className="mb-5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{erro}</p>}
        {carregando ? (
          <div className="grid gap-4 md:grid-cols-2">{[1, 2].map((item) => <div key={item} className="h-48 animate-pulse rounded-2xl border border-[#29394f] bg-[#101b2a]" />)}</div>
        ) : categorias.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categorias.map((categoria) => (
              <Link key={categoria.id} href={`/simulacoes/categoria/${encodeURIComponent(categoria.id)}`} className="group flex min-h-52 flex-col rounded-2xl border border-[#29394f] bg-[#101b2a] p-5 transition hover:border-[#b2ff00]/60">
                <FolderOpen className="text-[#b2ff00]" size={25} />
                <h2 className="mt-5 text-xl font-semibold text-white">{categoria.nome}</h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-400">{categoria.descricao}</p>
                <span className="mt-5 flex items-center justify-between text-xs text-slate-300"><span>{categoria.simulacoes.length} {categoria.simulacoes.length === 1 ? 'simulação' : 'simulações'}</span><ArrowRight size={16} className="transition group-hover:translate-x-1" /></span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#35465c] px-6 py-12 text-center">
            <FolderOpen aria-hidden="true" className="mx-auto text-slate-500" size={30} />
            <p className="mt-3 font-medium text-white">Ainda não há categorias disponíveis</p>
            <p className="mt-1 text-sm text-slate-400">Novos temas aparecerão aqui quando forem publicados.</p>
          </div>
        )}
      </section>
    </div>
  )
}
