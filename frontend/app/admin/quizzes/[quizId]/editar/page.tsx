"use client";

import {
  AdminListToolbar,
  AdminPagination,
  useAdminCollection,
} from "@/components/admin/list-toolbar";
import {
  AbasEditorAvaliacao,
  CamposQuestaoEditorial,
  PreviaAvaliacao,
  PreviaQuestaoEditorial,
  type AbaAvaliacao,
} from "@/components/admin/assessment-editor";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  listarQuizzesAdmin,
  listarAulas,
  atualizarQuizAdmin,
  salvarQuestaoQuiz,
  removerQuestaoQuiz,
  alterarStatusQuiz,
  type QuizAdmin,
  type AdminAula,
  type QuestaoQuizAdmin,
} from "@/lib/admin-api";

const vazio = () => ({
  enunciado: "",
  explicacao: "",
  ordem: 1,
  alternativas: [
    { texto: "", correta: true },
    { texto: "", correta: false },
  ],
});
export default function EditarQuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const [quiz, setQuiz] = useState<QuizAdmin | null>(null);
  const [aulas, setAulas] = useState<AdminAula[]>([]);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [aulaId, setAulaId] = useState("");
  const [questao, setQuestao] = useState(vazio);
  const [editando, setEditando] = useState<string | undefined>();
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const questoesLista = useAdminCollection(quiz?.questoes ?? [], (item) =>
    [item.enunciado, item.explicacao].join(" "),
  );
  const [aba, setAba] = useState<AbaAvaliacao>("informacoes");
  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro(null);
    Promise.all([listarQuizzesAdmin(), listarAulas()])
      .then(([quizzes, lista]) => {
        if (!ativo) return;
        const registro = quizzes.find((item) => item.id === quizId);
        if (!registro) throw new Error("Quiz não encontrado.");
        setQuiz(registro);
        setAulas(lista);
        setTitulo(registro.titulo);
        setDescricao(registro.descricao);
        setAulaId(registro.aulaId);
        setQuestao({
          ...vazio(),
          ordem:
            Math.max(
              0,
              ...(registro.questoes ?? []).map((item) => item.ordem),
            ) + 1,
        });
      })
      .catch((falha) => {
        if (ativo)
          setErro(
            falha instanceof Error
              ? falha.message
              : "Não foi possível carregar o quiz.",
          );
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [quizId, tentativa]);
  async function executar(operacao: () => Promise<unknown>, mensagem: string) {
    if (salvando) return;
    setSalvando(true);
    setErro(null);
    setSucesso(null);
    try {
      await operacao();
      setSucesso(mensagem);
      setEditando(undefined);
      setTentativa((value) => value + 1);
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível concluir a operação.",
      );
    } finally {
      setSalvando(false);
    }
  }
  function editar(item: QuestaoQuizAdmin) {
    setAba("questoes");
    setEditando(item.id);
    setQuestao({
      enunciado: item.enunciado,
      explicacao: item.explicacao,
      ordem: item.ordem,
      alternativas: item.alternativas.map((a) => ({
        texto: a.texto,
        correta: a.correta,
      })),
    });
    document
      .getElementById("editor-questao")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function salvar(event: FormEvent) {
    event.preventDefault();
    if (!Number.isInteger(questao.ordem) || questao.ordem < 1) {
      setErro("Informe uma ordem inteira maior que zero.");
      return;
    }
    if (
      questao.alternativas.length < 2 ||
      !questao.enunciado.trim() ||
      !questao.explicacao.trim() ||
      questao.alternativas.some((a) => !a.texto.trim()) ||
      questao.alternativas.filter((a) => a.correta).length !== 1
    ) {
      setErro(
        "Preencha o enunciado, a explicação e as alternativas, marcando uma única resposta correta.",
      );
      return;
    }
    void executar(
      () =>
        salvarQuestaoQuiz(
          quizId,
          {
            ...questao,
            enunciado: questao.enunciado.trim(),
            explicacao: questao.explicacao.trim(),
            alternativas: questao.alternativas.map((a, i) => ({
              texto: a.texto.trim(),
              correta: a.correta,
              ordem: i + 1,
            })),
          },
          editando,
        ),
      "Questão salva com sucesso.",
    );
  }
  const questaoEditorial = {
    enunciado: questao.enunciado,
    explicacao: questao.explicacao,
    alternativas: questao.alternativas.map((item) => ({
      texto: item.texto,
      isCorreta: item.correta,
    })),
  };
  const questoesSalvas = (quiz?.questoes ?? []).map((item) => ({
    ...item,
    alternativas: item.alternativas.map((alt) => ({
      ...alt,
      isCorreta: alt.correta,
    })),
  }));
  function novaQuestao() {
    setEditando(undefined);
    setQuestao({
      ...vazio(),
      ordem:
        Math.max(0, ...(quiz?.questoes ?? []).map((item) => item.ordem)) + 1,
    });
    setAba("questoes");
  }
  return (
    <section>
      <Link href="/admin/quizzes" className="admin-text-link">
        Voltar para quizzes
      </Link>
      <div className="admin-page-title">
        <div>
          <p>CONTEÚDO EDUCACIONAL</p>
          <h2>Editar quiz</h2>
          <span>
            Edite as informações, organize as perguntas e confira a
            apresentação.
          </span>
        </div>
        {quiz && (
          <span
            className="admin-status-label"
            data-tone={quiz.status === "PUBLICADO" ? "success" : "warning"}
          >
            {quiz.status === "PUBLICADO"
              ? "Publicado"
              : quiz.status === "ARQUIVADO"
                ? "Arquivado"
                : "Rascunho"}
          </span>
        )}
      </div>
      {erro && (
        <p className="admin-notice" data-tone="danger" role="alert">
          {erro}
          {!quiz && (
            <button
              type="button"
              onClick={() => setTentativa((value) => value + 1)}
            >
              Tentar novamente
            </button>
          )}
        </p>
      )}
      {sucesso && (
        <p className="admin-notice" data-tone="success" role="status">
          {sucesso}
        </p>
      )}
      {carregando ? (
        <p className="admin-empty-state" role="status">
          Carregando quiz...
        </p>
      ) : (
        quiz && (
          <>
            <div className="admin-assessment-navigation">
              <AbasEditorAvaliacao value={aba} onChange={setAba} />
              <div className="admin-assessment-publish">
                <button
                  type="button"
                  className="admin-action-secondary"
                  disabled={
                    salvando ||
                    quiz.status !== "RASCUNHO" ||
                    !quiz.questoes?.length
                  }
                  onClick={() =>
                    void executar(
                      () => alterarStatusQuiz(quizId, "PUBLICADO"),
                      "Quiz publicado.",
                    )
                  }
                >
                  Publicar quiz
                </button>
                {quiz.status !== "RASCUNHO" && (
                  <button
                    type="button"
                    className="admin-action-secondary"
                    disabled={salvando}
                    onClick={() =>
                      void executar(
                        () => alterarStatusQuiz(quizId, "RASCUNHO"),
                        "Quiz em rascunho.",
                      )
                    }
                  >
                    Voltar para rascunho
                  </button>
                )}
              </div>
            </div>
            <div className="admin-view-panel" hidden={aba !== "informacoes"}>
              <form
                className="admin-editor admin-assessment-form"
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!titulo.trim() || !descricao.trim() || !aulaId) {
                    setErro(
                      "Preencha o título, a descrição e a aula vinculada.",
                    );
                    return;
                  }
                  void executar(
                    () =>
                      atualizarQuizAdmin(quizId, {
                        titulo: titulo.trim(),
                        descricao: descricao.trim(),
                        aulaId,
                      }),
                    "Dados do quiz atualizados.",
                  );
                }}
              >
                <div className="admin-form-heading">
                  <h3>Informações do quiz</h3>
                  <p>
                    Somente rascunhos podem ser editados. Resultados de alunos
                    são preservados.
                  </p>
                </div>
                <fieldset
                  disabled={salvando || quiz.status !== "RASCUNHO"}
                  className="admin-field-grid"
                >
                  <label className="admin-field-wide">
                    Título do quiz
                    <input
                      className="admin-control"
                      value={titulo}
                      maxLength={160}
                      onChange={(e) => setTitulo(e.target.value)}
                    />
                  </label>
                  <label className="admin-field-wide">
                    Descrição e orientações
                    <textarea
                      className="admin-control"
                      rows={3}
                      maxLength={2000}
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                    />
                  </label>
                  <label className="admin-field-wide">
                    Aula vinculada
                    <select
                      className="admin-control"
                      value={aulaId}
                      onChange={(e) => setAulaId(e.target.value)}
                    >
                      {aulas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.trilha.titulo} · {a.titulo}
                        </option>
                      ))}
                    </select>
                  </label>
                </fieldset>
                <div className="admin-form-actions">
                  <button
                    className="admin-action-primary"
                    disabled={salvando || quiz.status !== "RASCUNHO"}
                  >
                    {salvando ? "Salvando..." : "Salvar informações"}
                  </button>
                </div>
              </form>
            </div>
            <div className="admin-view-panel" hidden={aba !== "questoes"}>
              <div className="admin-data-panel">
                <div className="admin-data-heading">
                  <div>
                    <h3>Questões cadastradas</h3>
                    <span>{quiz.questoes?.length ?? 0} questões</span>
                  </div>
                  {quiz.status === "RASCUNHO" && (
                    <button
                      type="button"
                      className="admin-action-secondary"
                      disabled={salvando}
                      onClick={novaQuestao}
                    >
                      Nova questão
                    </button>
                  )}
                </div>
                <AdminListToolbar
                  busca={questoesLista.busca}
                  onBusca={questoesLista.setBusca}
                  total={quiz.questoes?.length ?? 0}
                  exibidos={questoesLista.filtrados.length}
                  placeholder="Buscar nas questões"
                />
                {!questoesLista.filtrados.length && (
                  <p className="admin-empty-state">
                    Nenhuma questão encontrada. Adicione uma questão no
                    formulário abaixo.
                  </p>
                )}
                {questoesLista.visiveis.map((item) => (
                  <details className="admin-saved-question" key={item.id}>
                    <summary>
                      <span>Questão {item.ordem}</span>
                      <strong>{item.enunciado}</strong>
                    </summary>
                    <PreviaQuestaoEditorial
                      questao={{
                        ...item,
                        alternativas: item.alternativas.map((a) => ({
                          ...a,
                          isCorreta: a.correta,
                        })),
                      }}
                      numero={item.ordem}
                      gabarito
                    />
                    {quiz.status === "RASCUNHO" && (
                      <div className="admin-question-actions">
                        <button
                          className="admin-action-secondary"
                          type="button"
                          disabled={salvando}
                          onClick={() => editar(item)}
                        >
                          Editar questão
                        </button>
                        <button
                          className="admin-resource-remove"
                          type="button"
                          disabled={salvando}
                          onClick={() => {
                            if (
                              window.confirm(
                                "Excluir esta questão e suas alternativas?",
                              )
                            )
                              void executar(
                                () => removerQuestaoQuiz(quizId, item.id),
                                "Questão removida.",
                              );
                          }}
                        >
                          Excluir questão
                        </button>
                      </div>
                    )}
                  </details>
                ))}
                <AdminPagination
                  {...questoesLista}
                  total={questoesLista.filtrados.length}
                  onPagina={questoesLista.irParaPagina}
                  disabled={carregando || salvando}
                />
              </div>
              {quiz.status === "RASCUNHO" && (
                <form
                  className="admin-editor admin-assessment-form"
                  id="editor-questao"
                  onSubmit={salvar}
                  noValidate
                >
                  <div className="admin-form-heading">
                    <h3>{editando ? "Editar questão" : "Nova questão"}</h3>
                    <p>
                      Preencha a pergunta, as alternativas e a explicação da
                      resposta.
                    </p>
                  </div>
                  <fieldset disabled={salvando}>
                    <label className="admin-editor-field admin-question-order">
                      Ordem da questão
                      <input
                        className="admin-control"
                        type="number"
                        min={1}
                        step={1}
                        value={questao.ordem}
                        onChange={(e) =>
                          setQuestao({
                            ...questao,
                            ordem: Number(e.target.value),
                          })
                        }
                      />
                    </label>
                    <CamposQuestaoEditorial
                      value={questaoEditorial}
                      onChange={(value) =>
                        setQuestao({
                          ...questao,
                          enunciado: value.enunciado,
                          explicacao: value.explicacao ?? "",
                          alternativas: (value.alternativas ?? []).map(
                            (item) => ({
                              texto: item.texto,
                              correta: item.isCorreta,
                            }),
                          ),
                        })
                      }
                      explicacao
                      limiteAlternativas={10}
                      explicacaoMax={5000}
                      alternativaMax={2000}
                    />
                    <details className="admin-resource-section admin-question-inline-preview">
                      <summary>
                        <span>
                          Prévia desta questão
                          <small>
                            Confira o enunciado, as opções e o retorno para o
                            aluno.
                          </small>
                        </span>
                      </summary>
                      <div>
                        <PreviaQuestaoEditorial
                          questao={questaoEditorial}
                          numero={questao.ordem}
                          gabarito
                        />
                      </div>
                    </details>
                  </fieldset>
                  <div className="admin-form-actions">
                    {editando && (
                      <button
                        type="button"
                        className="admin-action-secondary"
                        disabled={salvando}
                        onClick={novaQuestao}
                      >
                        Cancelar edição
                      </button>
                    )}
                    <button
                      className="admin-action-primary"
                      disabled={salvando}
                    >
                      {salvando ? "Salvando..." : "Salvar questão"}
                    </button>
                  </div>
                </form>
              )}
            </div>
            <div className="admin-view-panel" hidden={aba !== "previa"}>
              <p className="admin-form-help">
                Prévia das questões salvas. Salve uma questão em edição para
                incluí-la nesta apresentação.
              </p>
              <PreviaAvaliacao
                titulo={titulo}
                descricao={descricao}
                vinculo={aulas.find((a) => a.id === aulaId)?.titulo}
                questoes={questoesSalvas}
              />
            </div>
          </>
        )
      )}
    </section>
  );
}
