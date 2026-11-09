"use client";
import { useCallback, useEffect, useState } from "react";
import { FormularioCenarioPhishing } from "@/components/admin/formulario-cenario-phishing";
import {
  listarAulas,
  listarCenariosAdmin,
  criarCenarioAdmin,
  atualizarCenarioAdmin,
  alterarStatusCenario,
  type AdminAula,
  type CenarioPhishingAdmin,
  type CenarioPhishingInput,
  type StatusPublicacao,
} from "@/lib/admin-api";

export default function AdminPhishingPage() {
  const [aulas, setAulas] = useState<AdminAula[]>([]),
    [cenarios, setCenarios] = useState<CenarioPhishingAdmin[]>([]);
  const [editando, setEditando] = useState<CenarioPhishingAdmin | null>(null),
    [aberto, setAberto] = useState(false),
    [erro, setErro] = useState(""),
    [loading, setLoading] = useState(true);
  const carregar = useCallback(async () => {
    try {
      const [a, c] = await Promise.all([listarAulas(), listarCenariosAdmin()]);
      setAulas(a);
      setCenarios(c);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao carregar.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void carregar();
  }, [carregar]);
  async function salvar(dados: CenarioPhishingInput) {
    if (editando) await atualizarCenarioAdmin(editando.id, dados);
    else await criarCenarioAdmin(dados);
    setAberto(false);
    setEditando(null);
    await carregar();
  }
  async function status(item: CenarioPhishingAdmin, valor: StatusPublicacao) {
    setErro("");
    try {
      await alterarStatusCenario(item.id, valor);
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao alterar status.");
    }
  }
  return (
    <section>
      <h1 className="text-3xl">Cenários de phishing</h1>
      <p className="my-3 text-slate-400">
        Cadastre, edite e publique as atividades vinculadas às aulas. Retorne a
        rascunho para editar.
      </p>
      <button
        onClick={() => {
          setEditando(null);
          setAberto(!aberto);
        }}
        className="rounded-lg bg-[#b2ff00] p-3 text-black"
      >
        Novo cenário
      </button>
      {erro && <p role="alert">{erro}</p>}
      {loading && <p>Carregando…</p>}
      {aberto && (
        <FormularioCenarioPhishing
          key={editando?.id ?? "novo"}
          aulas={aulas}
          inicial={editando ?? undefined}
          onSubmit={salvar}
        />
      )}
      {!loading && !cenarios.length && (
        <p className="my-6">Nenhum cenário cadastrado.</p>
      )}
      {cenarios.map((item) => (
        <article
          className="my-4 rounded-xl border border-slate-700 p-5"
          key={item.id}
        >
          <h2>{item.titulo}</h2>
          <p>{item.descricao}</p>
          <p>{item.tipo}</p>
          <select
            aria-label={`Status de ${item.titulo}`}
            className="my-3 bg-slate-900 p-2"
            value={item.status}
            onChange={(e) =>
              void status(item, e.target.value as StatusPublicacao)
            }
          >
            {["RASCUNHO", "PUBLICADO", "ARQUIVADO"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button
            className="ml-4"
            disabled={item.status !== "RASCUNHO"}
            onClick={() => {
              setEditando(item);
              setAberto(true);
            }}
          >
            Editar
          </button>
        </article>
      ))}
    </section>
  );
}
