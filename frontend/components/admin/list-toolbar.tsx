"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { Select } from '@base-ui/react/select';
import { paginarRegistros, selecionarRegistros } from "@/lib/admin-collection";

export function useAdminCollection<T>(
  items: T[],
  texto: (item: T) => string,
  categoria?: (item: T) => string,
) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("TODOS");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const filtrados = selecionarRegistros(items, texto, busca, filtro, categoria);
  const paginacao = paginarRegistros(filtrados, paginaAtual);
  useEffect(() => {
    setPaginaAtual((atual) => Math.min(atual, paginacao.totalPaginas));
  }, [paginacao.totalPaginas]);
  return {
    busca,
    setBusca: (valor: string) => {
      setBusca(valor);
      setPaginaAtual(1);
    },
    filtro,
    setFiltro: (valor: string) => {
      setFiltro(valor);
      setPaginaAtual(1);
    },
    filtrados,
    ...paginacao,
    irParaPagina: setPaginaAtual,
  };
}

export type OpcaoFiltroAdmin = { value: string; label: string };
export const FILTROS_PUBLICACAO: OpcaoFiltroAdmin[] = [
  { value: "TODOS", label: "Todas" },
  { value: "ATIVAS", label: "Ativas (publicadas)" },
  { value: "INATIVAS", label: "Inativas (rascunhos e arquivadas)" },
];
export const FILTROS_DISPONIBILIDADE: OpcaoFiltroAdmin[] = [
  { value: "TODOS", label: "Todas" },
  { value: "ATIVAS", label: "Ativas (disponíveis)" },
  { value: "INATIVAS", label: "Inativas (bloqueadas)" },
];

export function AdminPagination({
  pagina,
  totalPaginas,
  total,
  inicio,
  fim,
  onPagina,
  disabled = false,
}: {
  pagina: number;
  totalPaginas: number;
  total: number;
  inicio: number;
  fim: number;
  onPagina: (pagina: number) => void;
  disabled?: boolean;
}) {
  return (
    <nav
      className="admin-pagination admin-collection-pagination"
      aria-label="Paginação da lista"
    >
      <span aria-live="polite">
        {inicio}–{fim} de {total.toLocaleString("pt-BR")} registros · Página{" "}
        {pagina} de {totalPaginas}
      </span>
      <div>
        <button
          className="admin-action-secondary"
          type="button"
          disabled={disabled || pagina <= 1}
          onClick={() => onPagina(pagina - 1)}
          aria-label="Página anterior"
        >
          ← Anterior
        </button>
        <button
          className="admin-action-secondary"
          type="button"
          disabled={disabled || pagina >= totalPaginas}
          onClick={() => onPagina(pagina + 1)}
          aria-label="Próxima página"
        >
          Próxima →
        </button>
      </div>
    </nav>
  );
}

export function AdminListToolbar({
  busca,
  onBusca,
  total,
  exibidos,
  placeholder = "Buscar nos registros",
  children,
  filtro,
  onFiltro,
  opcoes,
  filtroLabel = "Situação",
}: {
  busca: string;
  onBusca: (value: string) => void;
  total: number;
  exibidos: number;
  placeholder?: string;
  children?: ReactNode;
  filtro?: string;
  onFiltro?: (value: string) => void;
  opcoes?: OpcaoFiltroAdmin[];
  filtroLabel?: string;
}) {
  const filtroId = useId();
  const labelId = `${filtroId}-label`;
  return (
    <div className="admin-list-toolbar">
      <label>
        <span>Buscar</span>
        <input
          type="search"
          value={busca}
          onChange={(event) => onBusca(event.target.value)}
          placeholder={placeholder}
        />
      </label>
      {opcoes && onFiltro && (
        <label className="admin-status-filter" htmlFor={filtroId}>
          <span id={labelId}>{filtroLabel}</span>
          <Select.Root items={opcoes} value={filtro ?? 'TODOS'} onValueChange={value => { if (typeof value === 'string') onFiltro(value); }} modal={false}>
            <Select.Trigger id={filtroId} aria-labelledby={labelId} className="admin-select-trigger">
              <Select.Value />
              <Select.Icon className="admin-select-chevron"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner className="admin-select-positioner" sideOffset={5} align="start" alignItemWithTrigger={false}>
                <Select.Popup className="admin-select-popup">
                  <Select.List className="admin-select-list">{opcoes.map(opcao => <Select.Item key={opcao.value} value={opcao.value} className="admin-select-option"><Select.ItemText>{opcao.label}</Select.ItemText></Select.Item>)}</Select.List>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </label>
      )}
      {children}
      <span className="admin-list-count" aria-live="polite">
        {exibidos.toLocaleString("pt-BR")} de {total.toLocaleString("pt-BR")}{" "}
        registros
      </span>
      {busca && (
        <button type="button" onClick={() => onBusca("")}>
          Limpar busca
        </button>
      )}
    </div>
  );
}
