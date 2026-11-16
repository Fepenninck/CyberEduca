"use client";

import {
  AdminListToolbar,
  AdminPagination,
  useAdminCollection,
} from "@/components/admin/list-toolbar";
import { useEffect, useState } from "react";
import { TabelaUsuarios } from "@/components/admin/tabela-usuarios";
import {
  excluirUsuario,
  listarUsuarios,
  type AdminUsuario,
} from "@/lib/admin-api";

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<AdminUsuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  const {
    busca,
    setBusca,
    filtrados,
    visiveis,
    pagina,
    totalPaginas,
    inicio,
    fim,
    irParaPagina,
    filtro,
    setFiltro,
  } = useAdminCollection(
    usuarios,
    (item) => [item.nome, item.email, item.papel].join(" "),
    (item) => item.papel,
  );

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro(null);

    listarUsuarios()
      .then((dados) => {
        if (ativo) setUsuarios(dados);
      })
      .catch((erroBusca: unknown) => {
        if (ativo)
          setErro(
            erroBusca instanceof Error
              ? erroBusca.message
              : "Não foi possível carregar os usuários.",
          );
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [tentativa]);

  async function removerUsuario(id: string) {
    await excluirUsuario(id);
    setTentativa((valor) => valor + 1);
  }

  return (
    <section>
      <div className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1768bd]">
          Gestão
        </p>
        <h2 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-[#242a33]">
          Usuários
        </h2>
        <p className="mt-2 text-sm text-[#626c79]">
          Consulte as contas cadastradas na plataforma.
        </p>
      </div>

      <AdminListToolbar
        busca={busca}
        onBusca={setBusca}
        total={usuarios.length}
        exibidos={filtrados.length}
        filtro={filtro}
        onFiltro={setFiltro}
        filtroLabel="Perfil"
        opcoes={[
          { value: "TODOS", label: "Todos os perfis" },
          ...Array.from(new Set(usuarios.map((item) => item.papel))).map(
            (papel) => ({
              value: papel,
              label:
                papel === "ADMIN"
                  ? "Administradores"
                  : papel === "USUARIO" || papel === "ALUNO"
                    ? "Alunos"
                    : papel,
            }),
          ),
        ]}
      />
      {(busca || filtro !== "TODOS") && !filtrados.length && !carregando && (
        <p role="status" className="admin-empty-state">
          Nenhum registro corresponde aos filtros selecionados.
        </p>
      )}
      {erro && (
        <div
          role="alert"
          className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-800"
        >
          <span>{erro}</span>
          <button
            type="button"
            onClick={() => setTentativa((valor) => valor + 1)}
            className="rounded-lg border border-rose-200/30 px-3 py-1.5 font-medium transition hover:bg-rose-200/10"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {carregando ? (
        <p role="status" className="text-sm text-[#626c79]">
          Carregando...
        </p>
      ) : (
        <TabelaUsuarios usuarios={visiveis} onDelete={removerUsuario} />
      )}
      {!carregando && (
        <AdminPagination
          pagina={pagina}
          totalPaginas={totalPaginas}
          total={filtrados.length}
          inicio={inicio}
          fim={fim}
          onPagina={irParaPagina}
        />
      )}
    </section>
  );
}
