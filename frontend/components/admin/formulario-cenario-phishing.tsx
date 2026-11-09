"use client";
import { useState, type FormEvent } from "react";
import type { AdminAula, CenarioPhishingInput } from "@/lib/admin-api";

export function FormularioCenarioPhishing({
  aulas,
  inicial,
  onSubmit,
}: {
  aulas: AdminAula[];
  inicial?: CenarioPhishingInput;
  onSubmit: (dados: CenarioPhishingInput) => Promise<void>;
}) {
  const [dados, setDados] = useState<CenarioPhishingInput>(
    inicial ?? {
      titulo: "",
      descricao: "",
      conteudoMensagem: "",
      tipo: "EMAIL",
      ehPhishing: true,
      explicacao: "",
      aulaId: "",
    },
  );
  const [erro, setErro] = useState(""),
    [salvando, setSalvando] = useState(false);
  async function enviar(event: FormEvent) {
    event.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      await onSubmit(dados);
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Não foi possível salvar.",
      );
    } finally {
      setSalvando(false);
    }
  }
  const campo =
    "block mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 p-3 text-white";
  return (
    <form
      onSubmit={enviar}
      className="my-6 grid gap-4 rounded-xl border border-slate-700 p-5"
    >
      {(["titulo", "descricao", "conteudoMensagem", "explicacao"] as const).map(
        (key) => (
          <label key={key}>
            {
              {
                titulo: "Título",
                descricao: "Descrição",
                conteudoMensagem: "Mensagem simulada",
                explicacao: "Explicação após a resposta",
              }[key]
            }
            <textarea
              className={campo}
              required
              maxLength={
                key === "titulo"
                  ? 160
                  : key === "descricao"
                    ? 2000
                    : key === "explicacao"
                      ? 5000
                      : 20000
              }
              value={dados[key]}
              onChange={(event) =>
                setDados({ ...dados, [key]: event.target.value })
              }
            />
          </label>
        ),
      )}
      <label>
        Aula
        <select
          className={campo}
          required
          value={dados.aulaId}
          onChange={(event) =>
            setDados({ ...dados, aulaId: event.target.value })
          }
        >
          <option value="">Selecione</option>
          {aulas.map((aula) => (
            <option key={aula.id} value={aula.id}>
              {aula.trilha.titulo} · {aula.titulo}
            </option>
          ))}
        </select>
      </label>
      <label>
        Tipo
        <select
          className={campo}
          value={dados.tipo}
          onChange={(event) =>
            setDados({
              ...dados,
              tipo: event.target.value as CenarioPhishingInput["tipo"],
            })
          }
        >
          {["EMAIL", "SMS", "SITE", "REDE_SOCIAL"].map((tipo) => (
            <option key={tipo}>{tipo}</option>
          ))}
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={dados.ehPhishing}
          onChange={(event) =>
            setDados({ ...dados, ehPhishing: event.target.checked })
          }
        />{" "}
        Esta mensagem é phishing
      </label>
      {erro && <p role="alert">{erro}</p>}
      <button
        className="rounded-lg bg-[#b2ff00] p-3 font-semibold text-black"
        disabled={salvando || !aulas.length}
      >
        {salvando ? "Salvando…" : "Salvar cenário"}
      </button>
    </form>
  );
}
