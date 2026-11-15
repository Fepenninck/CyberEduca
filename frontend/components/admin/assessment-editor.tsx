"use client";

import { useId, useState } from "react";
import { SimulationSceneEditor } from './simulation-scene-editor';
import { TemplateSimulation } from '../activities/template-simulation';
import { lerCenario, criarQuestaoCenario, type ModeloCenario } from '@/lib/simulation-scene';
import ReactMarkdown from "react-markdown";
import { paginarRegistros } from "@/lib/admin-collection";
import {
  separarContextoEditorial,
  type QuestaoEditorial,
} from "@/lib/admin-assessment";
import { AdminPagination, useAdminCollection } from "./list-toolbar";

export type AbaAvaliacao = "informacoes" | "questoes" | "previa";
export function AbasEditorAvaliacao({
  value,
  onChange,
  questoes = true,
  disabled = false,
}: {
  value: AbaAvaliacao;
  onChange: (value: AbaAvaliacao) => void;
  questoes?: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      className="admin-editor-tabs"
      role="group"
      aria-label="Seções da avaliação"
    >
      {[
        { value: "informacoes", label: "Informações" },
        ...(questoes ? [{ value: "questoes", label: "Questões" }] : []),
        { value: "previa", label: "Pré-visualização" },
      ].map((item) => (
        <button
          key={item.value}
          type="button"
          aria-pressed={value === item.value}
          disabled={disabled}
          onClick={() => onChange(item.value as AbaAvaliacao)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
export function CamposQuestaoEditorial({
  value,
  onChange,
  tipo = false,
  contexto = false,
  explicacao = false,
  alternativas = true,
  limiteAlternativas,
  explicacaoMax = 4000,
  alternativaMax = 1000,
}: {
  value: QuestaoEditorial;
  onChange: (value: QuestaoEditorial) => void;
  tipo?: boolean;
  contexto?: boolean;
  explicacao?: boolean;
  alternativas?: boolean;
  limiteAlternativas?: number;
  explicacaoMax?: number;
  alternativaMax?: number;
}) {
  const grupo = useId();
  const opcoes = value.alternativas ?? [];
  return (
    <div className="admin-question-fields">
      {tipo && (
        <label className="admin-editor-field">
          Tipo de questão
          <select
            className="admin-control"
            value={value.tipo ?? "MULTIPLA_ESCOLHA"}
            onChange={(event) =>
              onChange({
                ...value,
                tipo: event.target.value as QuestaoEditorial["tipo"],
                ...(event.target.value === "MULTIPLA_ESCOLHA" &&
                !value.alternativas?.length
                  ? {
                      alternativas: [
                        { texto: "", isCorreta: false },
                        { texto: "", isCorreta: false },
                      ],
                    }
                  : {}),
              })
            }
          >
            <option value="MULTIPLA_ESCOLHA">Múltipla escolha</option>
            <option value="DISSERTATIVA">Resposta em texto</option>
          </select>
        </label>
      )}
      {contexto && <SimulationSceneEditor value={value.contexto} onChange={contexto => onChange({...value, contexto})} />}
      <label className="admin-editor-field">
        Enunciado da questão
        <textarea
          className="admin-control"
          rows={4}
          maxLength={3000}
          value={value.enunciado}
          onChange={(event) =>
            onChange({ ...value, enunciado: event.target.value })
          }
          placeholder="Escreva a pergunta que será apresentada ao aluno."
        />
      </label>
      {alternativas && value.tipo !== "DISSERTATIVA" && (
        <fieldset className="admin-answer-options">
          <legend>Alternativas de resposta</legend>
          <p>Preencha as opções e marque uma única resposta correta.</p>
          {opcoes.map((opcao, index) => (
            <div className="admin-answer-option" key={index}>
              <label className="admin-answer-correct">
                <input
                  type="radio"
                  name={grupo}
                  checked={opcao.isCorreta}
                  onChange={() =>
                    onChange({
                      ...value,
                      alternativas: opcoes.map((item, i) => ({
                        ...item,
                        isCorreta: i === index,
                      })),
                    })
                  }
                />
                <span>Correta</span>
              </label>
              <label className="admin-editor-field">
                <span>Alternativa {String.fromCharCode(65 + index)}</span>
                <textarea
                  className="admin-control"
                  rows={2}
                  maxLength={alternativaMax}
                  value={opcao.texto}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      alternativas: opcoes.map((item, i) =>
                        i === index
                          ? { ...item, texto: event.target.value }
                          : item,
                      ),
                    })
                  }
                />
              </label>
              <button
                className="admin-resource-remove"
                type="button"
                disabled={opcoes.length <= 2}
                aria-label={`Remover alternativa ${index + 1}`}
                onClick={() =>
                  onChange({
                    ...value,
                    alternativas: opcoes.filter((_, i) => i !== index),
                  })
                }
              >
                Remover
              </button>
            </div>
          ))}
          <button
            type="button"
            className="admin-action-secondary"
            disabled={
              limiteAlternativas !== undefined &&
              opcoes.length >= limiteAlternativas
            }
            onClick={() =>
              onChange({
                ...value,
                alternativas: [...opcoes, { texto: "", isCorreta: false }],
              })
            }
          >
            Adicionar alternativa
          </button>
        </fieldset>
      )}
      {value.tipo === "DISSERTATIVA" && (
        <p className="admin-form-help">
          O aluno responderá com um texto. Não há alternativas para este tipo de
          questão.
        </p>
      )}
      {explicacao && (
        <label className="admin-editor-field">
          Explicação da resposta
          <textarea
            className="admin-control"
            rows={3}
            maxLength={explicacaoMax}
            value={value.explicacao ?? ""}
            onChange={(event) =>
              onChange({ ...value, explicacao: event.target.value })
            }
            placeholder="Explique por que a resposta está correta para ajudar o aluno a aprender."
          />
        </label>
      )}
    </div>
  );
}
export function PreviaQuestaoEditorial({
  questao,
  numero,
  gabarito = false,
}: {
  questao: QuestaoEditorial;
  numero: number;
  gabarito?: boolean;
}) {
  const contexto = separarContextoEditorial(questao.contexto);
  const cena = lerCenario(questao.contexto);
  return (
    <article className="admin-question-preview">
      <div className="admin-question-caption">
        <span>Questão {numero}</span>
        <small>
          {questao.tipo === "DISSERTATIVA"
            ? "Resposta em texto"
            : "Múltipla escolha"}
        </small>
      </div>
      {cena && <TemplateSimulation key={questao.contexto} cenario={cena} alternativas={(questao.alternativas ?? []).map((item, i) => ({id: String(i), texto: item.texto}))} />}
      {!cena && questao.contexto?.trim() && (
        <div className="admin-question-context">
          <strong>{contexto.titulo}</strong>
          <p>{contexto.texto}</p>
        </div>
      )}
      <div className="admin-question-statement">
        {questao.enunciado.trim() ? (
          <ReactMarkdown>{questao.enunciado}</ReactMarkdown>
        ) : (
          <p className="admin-preview-empty">O enunciado aparecerá aqui.</p>
        )}
      </div>
      {questao.tipo === "DISSERTATIVA" ? (
        <div className="admin-written-answer">
          Espaço para a resposta do aluno
        </div>
      ) : !cena ? (
        <ol className="admin-preview-options">
          {(questao.alternativas ?? []).map((item, index) => (
            <li key={index} data-correct={gabarito && item.isCorreta}>
              <span>{String.fromCharCode(65 + index)}</span>
              <div>{item.texto || "Texto da alternativa"}</div>
              {gabarito && item.isCorreta && <small>Correta</small>}
            </li>
          ))}
        </ol>
      ) : gabarito ? <p className="admin-form-help">{(questao.alternativas ?? []).filter(a => a.isCorreta).map(a => a.texto).join(" / ")}</p> : null}
      {gabarito && questao.explicacao && (
        <div className="admin-preview-feedback">
          <strong>Explicação da resposta</strong>
          <ReactMarkdown>{questao.explicacao}</ReactMarkdown>
        </div>
      )}
    </article>
  );
}
export function PreviaAvaliacao({
  titulo,
  descricao,
  vinculo,
  questoes,
  detalhe,
}: {
  titulo: string;
  descricao: string;
  vinculo?: string;
  questoes: QuestaoEditorial[];
  detalhe?: string;
}) {
  const [gabarito, setGabarito] = useState(false);
  const lista = useAdminCollection(questoes, (item) => item.enunciado);
  return (
    <div className="admin-assessment-preview">
      <header>
        <span>Pré-visualização</span>
        <h3>{titulo || "Título da avaliação"}</h3>
        {vinculo && <small>{vinculo}</small>}
        {descricao && <ReactMarkdown>{descricao}</ReactMarkdown>}
        <div className="admin-preview-controls">
          <span>
            {questoes.length} questões{detalhe ? ` · ${detalhe}` : ""}
          </span>
          {questoes.length > 0 && (
            <label>
              <input
                type="checkbox"
                checked={gabarito}
                onChange={(event) => setGabarito(event.target.checked)}
              />
              Mostrar gabarito e explicações
            </label>
          )}
        </div>
      </header>
      {lista.visiveis.map((questao, index) => (
        <PreviaQuestaoEditorial
          key={(lista.pagina - 1) * 4 + index}
          questao={questao}
          numero={(lista.pagina - 1) * 4 + index + 1}
          gabarito={gabarito}
        />
      ))}
      {!questoes.length && (
        <p className="admin-empty-state">
          As questões aparecerão aqui depois de adicionadas.
        </p>
      )}
      <AdminPagination
        {...lista}
        total={questoes.length}
        onPagina={lista.irParaPagina}
      />
    </div>
  );
}
export function QuestoesRascunhoEditor({
  value,
  onChange,
  simulacao = false,
  modeloCenario = "EMAIL",
  foco,
  onFocoConsumido,
}: {
  value: QuestaoEditorial[];
  onChange: (questoes: QuestaoEditorial[]) => void;
  simulacao?: boolean;
  modeloCenario?: ModeloCenario;
  foco?: number | null;
  onFocoConsumido?: () => void;
}) {
  const [pagina, setPagina] = useState(1);
  const [aberta, setAberta] = useState<number | null>(null);
  const paginaExibida =
    foco !== null && foco !== undefined ? Math.floor(foco / 4) + 1 : pagina;
  const lista = paginarRegistros(value, paginaExibida);
  const selecionada = foco ?? aberta;
  function selecionar(indice: number | null) {
    setPagina(lista.pagina);
    setAberta(indice);
    onFocoConsumido?.();
  }
  function adicionar() {
    const indice = value.length;
    onChange([
      ...value,
      {
        enunciado: "",
        ...(simulacao
          ? { contexto: "", explicacao: "" }
          : { tipo: "MULTIPLA_ESCOLHA" as const }),
        alternativas: [
          { texto: "", isCorreta: false },
          { texto: "", isCorreta: false },
        ],
        ...(simulacao ? criarQuestaoCenario(modeloCenario) : {}),
      },
    ]);
    setPagina(Math.floor(indice / 4) + 1);
    setAberta(indice);
    onFocoConsumido?.();
  }
  return (
    <div className="admin-draft-questions">
      <div className="admin-data-heading">
        <div>
          <h3>{simulacao ? "Cenários e questões" : "Questões da prova"}</h3>
          <p>Abra uma questão para editar o enunciado e as respostas.</p>
        </div>
        <button
          type="button"
          className="admin-action-secondary"
          onClick={adicionar}
        >
          Adicionar questão
        </button>
      </div>
      {!value.length && (
        <p className="admin-empty-state">
          Nenhuma questão adicionada. Use o botão acima para começar.
        </p>
      )}
      {lista.visiveis.map((questao, local) => {
        const indice = (lista.pagina - 1) * 4 + local;
        const expandida = selecionada === indice;
        return (
          <div className="admin-draft-question" key={indice}>
            <div className="admin-draft-question-heading">
              <button
                type="button"
                aria-expanded={expandida}
                onClick={() => selecionar(expandida ? null : indice)}
              >
                <span>Questão {indice + 1}</span>
                <strong>{questao.enunciado.trim() || "Nova questão"}</strong>
                <small>{expandida ? "Recolher" : "Editar questão"}</small>
              </button>
              <button
                type="button"
                className="admin-resource-remove"
                onClick={() => {
                  onChange(value.filter((_, i) => i !== indice));
                  selecionar(null);
                }}
              >
                Remover
              </button>
            </div>
            {expandida && (
              <CamposQuestaoEditorial
                value={questao}
                onChange={(atualizada) =>
                  onChange(
                    value.map((item, i) => (i === indice ? atualizada : item)),
                  )
                }
                tipo={!simulacao}
                contexto={simulacao}
                explicacao={simulacao}
              />
            )}
          </div>
        );
      })}
      <AdminPagination
        {...lista}
        total={value.length}
        onPagina={(numero) => {
          setPagina(numero);
          setAberta(null);
          onFocoConsumido?.();
        }}
      />
    </div>
  );
}
