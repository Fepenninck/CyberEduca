"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { AdminUsuario } from "@/lib/admin-api";

type TabelaUsuariosProps = {
  usuarios: AdminUsuario[];
  onDelete: (id: string) => Promise<void>;
};

function formatarData(data: string) {
  const valor = new Date(data);
  return Number.isNaN(valor.getTime())
    ? "—"
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(valor);
}

export function TabelaUsuarios({ usuarios, onDelete }: TabelaUsuariosProps) {
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function excluir(id: string) {
    if (!window.confirm("Tem certeza que deseja excluir?")) return;
    setExcluindoId(id);
    setErro(null);
    try {
      await onDelete(id);
    } catch (erroExclusao) {
      setErro(
        erroExclusao instanceof Error
          ? erroExclusao.message
          : "Não foi possível excluir o usuário.",
      );
    } finally {
      setExcluindoId(null);
    }
  }

  return (
    <div>
      {erro && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"
        >
          {erro}
        </p>
      )}
      <div className="overflow-hidden rounded-2xl border border-[#29394f] bg-[#101b2a]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-[#152235] text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th scope="col" className="px-5 py-4 font-semibold">
                  Nome
                </th>
                <th scope="col" className="px-5 py-4 font-semibold">
                  Email
                </th>
                <th scope="col" className="px-5 py-4 font-semibold">
                  Papel
                </th>
                <th scope="col" className="px-5 py-4 font-semibold">
                  Data de criação
                </th>
                <th scope="col" className="px-5 py-4 text-right font-semibold">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#29394f]">
              {usuarios.map((usuario) => (
                <tr
                  key={usuario.id}
                  className="transition hover:bg-white/[0.025]"
                >
                  <td className="px-5 py-4 font-medium text-white">
                    <Link
                      href={`/admin/usuarios/${encodeURIComponent(usuario.id)}`}
                    >
                      {usuario.nome}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-slate-300">{usuario.email}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${usuario.papel === "ADMIN" ? "bg-[#b2ff00]/10 text-[#c8ff5e]" : "bg-slate-700/60 text-slate-300"}`}
                    >
                      {usuario.papel}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-400">
                    {formatarData(usuario.criadoEm)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/usuarios/${encodeURIComponent(usuario.id)}/editar`}
                        aria-label={`Editar usuário ${usuario.nome}`}
                        className="rounded-lg border border-[#35465c] p-2 text-slate-300 transition hover:border-[#b2ff00] hover:text-[#b2ff00]"
                      >
                        <Pencil aria-hidden="true" size={16} />
                      </Link>
                      <button
                        type="button"
                        aria-label={`Excluir usuário ${usuario.nome}`}
                        disabled={excluindoId === usuario.id}
                        onClick={() => void excluir(usuario.id)}
                        className="rounded-lg border border-[#35465c] p-2 text-slate-300 transition hover:border-rose-400 hover:text-rose-300 disabled:opacity-50"
                      >
                        <Trash2 aria-hidden="true" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-slate-400"
                  >
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
