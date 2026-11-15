"use client";

import {
  AdminListToolbar,
  AdminPagination,
  useAdminCollection,
} from "@/components/admin/list-toolbar";
import {
  AbasEditorAvaliacao,
  PreviaAvaliacao,
  PreviaQuestaoEditorial,
  type AbaAvaliacao,
} from "@/components/admin/assessment-editor";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FormularioAlternativaProva } from "@/components/admin/formulario-alternativa-prova";
import { FormularioProva } from "@/components/admin/formulario-prova";
import { FormularioQuestaoProva } from "@/components/admin/formulario-questao-prova";
import {
  adicionarAlternativaProva,
  adicionarQuestaoProva,
  atualizarProvaAdmin,
  listarProvasAdmin,
  listarTrilhas,
  type AdminTrilha,
  type AlternativaProvaInput,
  type ProvaAdmin,
  type ProvaInput,
  type QuestaoProvaAdmin,
} from "@/lib/admin-api";

export default function EditarProvaPage() {
  const { provaId } = useParams<{ provaId: string }>();
  const [prova, setProva] = useState<ProvaAdmin | null>(null);
  const [trilhas, setTrilhas] = useState<AdminTrilha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [questaoAtualizando, setQuestaoAtualizando] = useState(false);
  const [alternativaAtualizando, setAlternativaAtualizando] = useState<
    string | null
  >(null);

  const questoesLista = useAdminCollection(
    prova?.questoes ?? [],
    (item) => item.enunciado,
  );
  const [aba, setAba] = useState<AbaAvaliacao>("informacoes");
  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro(null);

    Promise.all([listarProvasAdmin(), listarTrilhas()])
      .then(([provas, listaTrilhas]) => {
        if (!ativo) return;
        const provaEncontrada = provas.find((item) => item.id === provaId);
        if (!provaEncontrada) {
          setErro("A prova solicitada não foi encontrada.");
          return;
        }
        setProva({
          ...provaEncontrada,
          questoes: provaEncontrada.questoes ?? [],
        });
        setTrilhas(listaTrilhas);
      })
      .catch((erroBusca: unknown) => {
        if (ativo)
          setErro(
            erroBusca instanceof Error
              ? erroBusca.message
              : "Não foi possível carregar os dados da prova.",
          );
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [provaId]);

  async function salvarDadosProva(dados: ProvaInput) {
    if (!prova) return;
    const { questoes: _questoes, ...dadosBasicos } = dados;
    const atualizada = await atualizarProvaAdmin(prova.id, dadosBasicos);
    setProva((atual) =>
      atual
        ? {
            ...atual,
            ...dadosBasicos,
            ...atualizada,
            questoes: atualizada.questoes ?? atual.questoes,
          }
        : atual,
    );
    setSucesso("Dados da prova atualizados.");
    setErro(null);
  }

  async function adicionarQuestao(dados: {
    enunciado: string;
    tipo: "MULTIPLA_ESCOLHA" | "DISSERTATIVA";
  }) {
    if (!prova) return;
    setQuestaoAtualizando(true);
    setErro(null);
    setSucesso(null);

    try {
      const questao = await adicionarQuestaoProva(prova.id, dados);
      setProva((atual) =>
        atual
          ? {
              ...atual,
              questoes: [
                ...(atual.questoes ?? []),
                { ...questao, alternativas: questao.alternativas ?? [] },
              ],
            }
          : atual,
      );
      setSucesso("Questão adicionada à prova.");
    } catch (erroEnvio) {
      setErro(
        erroEnvio instanceof Error
          ? erroEnvio.message
          : "Não foi possível adicionar a questão.",
      );
      throw erroEnvio;
    } finally {
      setQuestaoAtualizando(false);
    }
  }

  async function adicionarAlternativa(
    questaoId: string,
    dados: AlternativaProvaInput,
  ) {
    if (!prova) return;
    setAlternativaAtualizando(questaoId);
    setErro(null);
    setSucesso(null);

    try {
      const alternativa = await adicionarAlternativaProva(
        prova.id,
        questaoId,
        dados,
      );
      setProva((atual) =>
        atual
          ? {
              ...atual,
              questoes: (atual.questoes ?? []).map((questao) =>
                questao.id === questaoId
                  ? {
                      ...questao,
                      alternativas: [
                        ...(questao.alternativas ?? []),
                        alternativa,
                      ],
                    }
                  : questao,
              ),
            }
          : atual,
      );
      setSucesso("Alternativa adicionada à questão.");
    } catch (erroEnvio) {
      setErro(
        erroEnvio instanceof Error
          ? erroEnvio.message
          : "Não foi possível adicionar a alternativa.",
      );
      throw erroEnvio;
    } finally {
      setAlternativaAtualizando(null);
    }
  }

  return (
    <section>
      <Link href="/admin/provas" className="admin-text-link">
        Voltar para provas
      </Link>
      <div className="admin-page-title">
        <div>
          <p>AVALIAÇÃO EDUCACIONAL</p>
          <h2>{prova?.titulo || "Editar prova"}</h2>
          <span>
            Edite as informações e confira as questões antes de disponibilizar a
            prova.
          </span>
        </div>
      </div>
      {erro && (
        <p role="alert" className="admin-notice" data-tone="danger">
          {erro}
        </p>
      )}
      {sucesso && (
        <p role="status" className="admin-notice" data-tone="success">
          {sucesso}
        </p>
      )}
      {carregando ? (
        <p className="admin-empty-state" role="status">
          Carregando prova...
        </p>
      ) : (
        prova && (
          <>
            <div className="admin-assessment-navigation">
              <AbasEditorAvaliacao value={aba} onChange={setAba} />
            </div>
            <div className="admin-view-panel" hidden={aba !== "informacoes"}>
              <FormularioProva
                key={prova.id}
                trilhas={trilhas}
                initialValues={prova}
                permitirQuestoes={false}
                mostrarPrevia={false}
                submitLabel="Salvar informações da prova"
                onSubmit={salvarDadosProva}
              />
            </div>
            <div className="admin-view-panel" hidden={aba !== "questoes"}>
              <div className="admin-data-panel">
                <div className="admin-data-heading">
                  <div>
                    <h3>Questões cadastradas</h3>
                    <span>
                      {prova.questoes?.length ?? 0} questões · Abra uma questão
                      para conferir as respostas.
                    </span>
                  </div>
                </div>
                <AdminListToolbar
                  busca={questoesLista.busca}
                  onBusca={questoesLista.setBusca}
                  total={prova.questoes?.length ?? 0}
                  exibidos={questoesLista.filtrados.length}
                  placeholder="Buscar nas questões"
                />
                {questoesLista.visiveis.map((questao) => {
                  const numero =
                    (prova.questoes ?? []).findIndex(
                      (item) => item.id === questao.id,
                    ) + 1;
                  return (
                    <details className="admin-saved-question" key={questao.id}>
                      <summary>
                        <span>Questão {numero}</span>
                        <strong>{questao.enunciado}</strong>
                      </summary>
                      <PreviaQuestaoEditorial
                        questao={questao}
                        numero={numero}
                        gabarito
                      />
                      {questao.tipo === "MULTIPLA_ESCOLHA" && (
                        <div className="admin-saved-answer-form">
                          <h4>Adicionar alternativa</h4>
                          <FormularioAlternativaProva
                            onSubmit={(dados) =>
                              adicionarAlternativa(questao.id, dados)
                            }
                          />
                          {alternativaAtualizando === questao.id && (
                            <p role="status" className="admin-form-help">
                              Salvando alternativa...
                            </p>
                          )}
                        </div>
                      )}
                    </details>
                  );
                })}
                {!questoesLista.filtrados.length && (
                  <p className="admin-empty-state">
                    Nenhuma questão encontrada. Adicione a primeira questão no
                    formulário abaixo.
                  </p>
                )}
                <AdminPagination
                  {...questoesLista}
                  total={questoesLista.filtrados.length}
                  onPagina={questoesLista.irParaPagina}
                  disabled={questaoAtualizando || !!alternativaAtualizando}
                />
              </div>
              <FormularioQuestaoProva onSubmit={adicionarQuestao} />
            </div>
            <div className="admin-view-panel" hidden={aba !== "previa"}>
              <p className="admin-form-help">
                Prévia dos dados salvos. Salve as informações e as alternativas
                para conferir suas alterações.
              </p>
              <PreviaAvaliacao
                titulo={prova.titulo}
                descricao={prova.descricao}
                vinculo={
                  trilhas.find((item) => item.id === prova.trilhaId)?.titulo
                }
                questoes={prova.questoes ?? []}
              />
            </div>
          </>
        )
      )}
    </section>
  );
}
