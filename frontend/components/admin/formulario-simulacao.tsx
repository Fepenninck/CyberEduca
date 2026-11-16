"use client";

import { modelosCenario, lerCenario, type ModeloCenario } from '@/lib/simulation-scene';
import { useState, type FormEvent } from "react";
import type { CategoriaSimulacaoAdmin, SimulacaoInput } from "@/lib/admin-api";
import {
  prepararQuestoesSimulacao,
  validarQuestoesEditoriais,
} from "@/lib/admin-assessment";
import {
  AbasEditorAvaliacao,
  PreviaAvaliacao,
  QuestoesRascunhoEditor,
  type AbaAvaliacao,
} from "./assessment-editor";

type Props = {
  categorias: CategoriaSimulacaoAdmin[];
  onSubmit: (dados: SimulacaoInput) => Promise<void>;
  initialValues?: Partial<SimulacaoInput>;
  submitLabel?: string;
};
export function FormularioSimulacao({
  categorias,
  onSubmit,
  initialValues,
  submitLabel = "Salvar simulação",
}: Props) {
  const [titulo, setTitulo] = useState(initialValues?.titulo ?? "");
  const [descricao, setDescricao] = useState(initialValues?.descricao ?? "");
  const [nivel, setNivel] = useState<NonNullable<SimulacaoInput["nivel"]>>(
    initialValues?.nivel ?? "BASICO",
  );
  const [duracaoMinutos, setDuracaoMinutos] = useState(
    initialValues?.duracaoMinutos ?? 5,
  );
  const [categoriaId, setCategoriaId] = useState(
    initialValues?.categoriaId ?? categorias[0]?.id ?? "",
  );
  const [questoes, setQuestoes] = useState<SimulacaoInput["questoes"]>(
    initialValues?.questoes ?? [],
  );
  const [modelo, setModelo] = useState<ModeloCenario>(lerCenario(initialValues?.questoes?.[0]?.contexto)?.modelo ?? "EMAIL");
  const [aba, setAba] = useState<AbaAvaliacao>("informacoes");
  const [foco, setFoco] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (salvando) return;
    setErro(null);
    if (!titulo.trim() || !descricao.trim() || !categoriaId) {
      setErro("Preencha o título, a descrição e a categoria da simulação.");
      setAba("informacoes");
      return;
    }
    if (
      !Number.isInteger(duracaoMinutos) ||
      duracaoMinutos < 1 ||
      duracaoMinutos > 60
    ) {
      setErro("Informe uma duração de 1 a 60 minutos.");
      setAba("informacoes");
      return;
    }
    const falha = validarQuestoesEditoriais(questoes, true);
    if (falha) {
      setErro(falha.mensagem);
      setAba("questoes");
      setFoco(falha.indice);
      return;
    }
    setSalvando(true);
    try {
      await onSubmit({
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        categoriaId,
        nivel,
        duracaoMinutos,
        questoes: prepararQuestoesSimulacao(questoes),
      });
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível salvar a simulação.",
      );
    } finally {
      setSalvando(false);
    }
  }
  return (
    <form
      className="admin-editor admin-assessment-form"
      onSubmit={enviar}
      noValidate
      aria-busy={salvando}
    >
      <div className="admin-form-heading">
        <h3>Dados da simulação</h3>
        <p>
          Prepare situações práticas, alternativas de resposta e o feedback para
          o aluno.
        </p>
      </div>
      <fieldset disabled={salvando}>
        <AbasEditorAvaliacao value={aba} onChange={setAba} />
        <div className="admin-editor-body">
          {aba === "informacoes" && (
            <div className="admin-field-grid">
              <label className="admin-field-wide">
                Título da simulação
                <input
                  className="admin-control"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  maxLength={160}
                  placeholder="Ex.: Identificando uma mensagem suspeita"
                />
              </label>
              <label className="admin-field-wide">
                Descrição e orientações
                <textarea
                  className="admin-control"
                  rows={3}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  maxLength={2000}
                  placeholder="Explique a situação e o objetivo deste treinamento."
                />
              </label>
              <label className="admin-field-wide">
                Modelo para novos cenários
                <select className="admin-control" value={modelo} onChange={event => setModelo(event.target.value as ModeloCenario)}>{Object.entries(modelosCenario).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>
                <small className="admin-form-help">Cada nova questão recebe este modelo pronto. Na aba de questões, edite o conteúdo e as ações ou escolha outro modelo. Os cenários existentes são preservados.</small>
              </label>
              <label>
                Categoria
                <select
                  className="admin-control"
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                >
                  <option value="" disabled>
                    Selecione uma categoria
                  </option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Dificuldade
                <select
                  className="admin-control"
                  value={nivel}
                  onChange={(e) => setNivel(e.target.value as typeof nivel)}
                >
                  <option value="BASICO">Básico</option>
                  <option value="INTERMEDIARIO">Intermediário</option>
                  <option value="AVANCADO">Avançado</option>
                </select>
              </label>
              <label>
                Duração estimada (minutos)
                <input
                  className="admin-control"
                  type="number"
                  min={1}
                  max={60}
                  step={1}
                  value={duracaoMinutos}
                  onChange={(e) => setDuracaoMinutos(Number(e.target.value))}
                />
              </label>
            </div>
          )}
          {aba === "questoes" && (
            <QuestoesRascunhoEditor
              value={questoes}
              onChange={(value) =>
                setQuestoes(
                  value.map((item) => ({
                    ...item,
                    alternativas: item.alternativas ?? [],
                  })),
                )
              }
              simulacao
              modeloCenario={modelo}
              foco={foco}
              onFocoConsumido={() => setFoco(null)}
            />
          )}
          {aba === "previa" && (
            <PreviaAvaliacao
              titulo={titulo}
              descricao={descricao}
              vinculo={categorias.find((c) => c.id === categoriaId)?.nome}
              questoes={questoes}
              detalhe={`${duracaoMinutos} minutos · Treinamento prático sem nota`}
            />
          )}
        </div>
      </fieldset>
      {!categorias.length && (
        <p className="admin-notice" data-tone="warning">
          Crie uma categoria na seção de categorias antes de salvar a simulação.
        </p>
      )}
      {erro && (
        <p className="admin-notice" data-tone="danger" role="alert">
          {erro}
        </p>
      )}
      <div className="admin-form-actions">
        <span className="admin-form-help">
          {questoes.length} questões nesta simulação
        </span>
        <button
          type="submit"
          className="admin-action-primary"
          disabled={salvando || !categorias.length}
        >
          {salvando ? "Salvando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
