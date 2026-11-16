"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import type { AdminAula, AdminTrilha, AulaInput } from "@/lib/admin-api";
import {
  carregarConteudoAula,
  novoMaterialAula,
  serializarMaterialAula,
  validarMaterialAula,
} from "@/lib/admin-lesson-editor";
import {
  ConteudoEditorialAula,
  RecursosEditoriaisAula,
  PreviaEditorialAula,
  type AbaAula,
} from "./lesson-material-editor";

type Props = {
  trilhas: AdminTrilha[];
  aulasExistentes: AdminAula[];
  onSubmit: (dados: AulaInput) => Promise<void>;
  initialValues?: Partial<AdminAula>;
  submitLabel?: string;
  onCancel?: () => void;
};
const abas: { value: AbaAula; label: string }[] = [
  { value: "conteudo", label: "Conteúdo" },
  { value: "apoio", label: "Recursos de apoio" },
  { value: "previa", label: "Pré-visualização" },
];
export function FormularioAula({
  trilhas,
  aulasExistentes,
  onSubmit,
  initialValues,
  submitLabel = "Salvar aula",
  onCancel,
}: Props) {
  const proximaOrdem = (id: string) =>
    Math.max(
      0,
      ...aulasExistentes
        .filter((aula) => aula.trilhaId === id)
        .map((aula) => aula.ordem),
    ) + 1;
  const [inicial] = useState(() =>
    carregarConteudoAula(initialValues?.conteudo ?? ""),
  );
  const [estruturado, setEstruturado] = useState(
    inicial.modo === "estruturado",
  );
  const [material, setMaterial] = useState(
    inicial.modo === "estruturado" ? inicial.material : novoMaterialAula(),
  );
  const [texto, setTexto] = useState(
    inicial.modo === "texto" ? inicial.texto : "",
  );
  const [trilhaId, setTrilhaId] = useState(
    initialValues?.trilhaId ?? trilhas[0]?.id ?? "",
  );
  const [titulo, setTitulo] = useState(initialValues?.titulo ?? "");
  const [ordem, setOrdem] = useState(
    String(initialValues?.ordem ?? proximaOrdem(trilhaId)),
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aba, setAba] = useState<AbaAula>("conteudo");
  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (salvando) return;
    setErro(null);
    if (inicial.modo === "invalido") {
      setErro(
        "Não foi possível abrir o conteúdo desta aula. Cancele e recarregue a página. O material original foi preservado.",
      );
      return;
    }
    if (!titulo.trim() || titulo.trim().length > 160) {
      setErro("Informe um título de até 160 caracteres.");
      return;
    }
    const trilha = trilhas.find((item) => item.id === trilhaId);
    if (!trilha) {
      setErro("Selecione uma trilha para a aula.");
      return;
    }
    const posicao = Number(ordem);
    if (!Number.isInteger(posicao) || posicao < 1) {
      setErro("Informe uma ordem inteira maior que zero.");
      return;
    }
    if (
      aulasExistentes.some(
        (aula) =>
          aula.id !== initialValues?.id &&
          aula.trilhaId === trilhaId &&
          aula.ordem === posicao,
      )
    ) {
      setErro(
        "Essa posição já está ocupada nesta trilha. Escolha outra ordem.",
      );
      return;
    }
    if (estruturado) {
      const falha = validarMaterialAula(material);
      if (falha) {
        setErro(falha);
        setAba(!material.concept.trim() ? "conteudo" : "apoio");
        return;
      }
    } else if (!texto.trim()) {
      setErro("Escreva o conteúdo da aula.");
      setAba("conteudo");
      return;
    }
    const conteudo = estruturado
      ? serializarMaterialAula(
          {
            ...material,
            ...(material.objectives
              ? {
                  objectives: material.objectives.filter((item) => item.trim()),
                }
              : {}),
          },
          titulo,
          trilha.nivel,
        )
      : texto.trim();
    if (conteudo.length > 500000) {
      setErro(
        "O conteúdo excede o tamanho permitido. Reduza o material antes de salvar.",
      );
      return;
    }
    setSalvando(true);
    try {
      await onSubmit({
        titulo: titulo.trim(),
        conteudo,
        trilhaId,
        ordem: posicao,
      });
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível salvar a aula.",
      );
    } finally {
      setSalvando(false);
    }
  }
  return (
    <form
      onSubmit={enviar}
      className="admin-editor admin-lesson-form"
      aria-busy={salvando}
      noValidate
    >
      <fieldset disabled={salvando}>
        <div className="admin-form-heading">
          <h3>Informações da aula</h3>
          <p>Defina o nome e a posição da aula na trilha.</p>
        </div>
        <div className="admin-field-grid">
          <label className="admin-field-wide">
            Título da aula
            <input
              className="admin-control"
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              maxLength={160}
              required
              placeholder="Ex.: Uma senha diferente para cada conta"
            />
          </label>
          <label>
            Trilha
            <select
              className="admin-control"
              value={trilhaId}
              onChange={(event) => {
                setTrilhaId(event.target.value);
                setOrdem(String(proximaOrdem(event.target.value)));
              }}
              required
            >
              <option value="" disabled>
                Selecione uma trilha
              </option>
              {trilhas.map((trilha) => (
                <option key={trilha.id} value={trilha.id}>
                  {trilha.titulo}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ordem dentro da trilha
            <input
              className="admin-control"
              type="number"
              value={ordem}
              min={1}
              step={1}
              required
              onChange={(event) => setOrdem(event.target.value)}
            />
            <small>Cada aula ocupa uma posição única.</small>
          </label>
        </div>
        {!trilhas.length && (
          <p className="admin-notice" data-tone="warning">
            Cadastre uma trilha para vincular esta aula.{" "}
            <Link href="/admin/trilhas#nova">Criar trilha</Link>
          </p>
        )}
        <div className="admin-form-heading admin-form-divider">
          <h3>Material da aula</h3>
          <p>
            Edite o texto e os recursos nos campos abaixo. Confira o resultado
            antes de salvar.
          </p>
        </div>
        {inicial.modo === "invalido" ? (
          <p role="alert" className="admin-notice" data-tone="danger">
            Não foi possível abrir este conteúdo para edição. Cancele e
            recarregue a página. O material original não foi alterado.
          </p>
        ) : (
          <>
            <div
              className="admin-editor-tabs"
              role="group"
              aria-label="Seções do material"
            >
              {abas.map((item) => (
                <button
                  type="button"
                  key={item.value}
                  aria-pressed={aba === item.value}
                  onClick={() => setAba(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="admin-editor-body">
              {aba === "conteudo" &&
                (estruturado ? (
                  <ConteudoEditorialAula
                    material={material}
                    onChange={setMaterial}
                  />
                ) : (
                  <label className="admin-editor-field">
                    Texto da aula
                    <textarea
                      className="admin-control admin-legacy-content"
                      value={texto}
                      onChange={(event) => setTexto(event.target.value)}
                      rows={10}
                      placeholder="Escreva o conteúdo da aula."
                    />
                  </label>
                ))}
              {aba === "apoio" &&
                (estruturado ? (
                  <RecursosEditoriaisAula
                    material={material}
                    onChange={setMaterial}
                  />
                ) : (
                  <div className="admin-resource-convert">
                    <h4>Complemente esta aula</h4>
                    <p>
                      Organize o texto em campos e acrescente objetivos, vídeo,
                      diagrama e referências. O texto existente será mantido na
                      explicação principal.
                    </p>
                    <button
                      type="button"
                      className="admin-action-secondary"
                      onClick={() => {
                        setMaterial({ ...novoMaterialAula(), concept: texto });
                        setEstruturado(true);
                      }}
                    >
                      Adicionar recursos à aula
                    </button>
                  </div>
                ))}
              {aba === "previa" &&
                (estruturado ? (
                  <PreviaEditorialAula material={material} titulo={titulo} />
                ) : (
                  <div className="admin-markdown-preview">
                    <h3>{titulo}</h3>
                    {texto.trim() ? (
                      <ReactMarkdown>{texto}</ReactMarkdown>
                    ) : (
                      <p>
                        O conteúdo aparecerá aqui quando você começar a
                        escrever.
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </>
        )}
      </fieldset>
      {erro && (
        <p role="alert" className="admin-notice" data-tone="danger">
          {erro}
        </p>
      )}
      <div className="admin-form-actions">
        {onCancel && (
          <button
            type="button"
            className="admin-action-secondary"
            onClick={onCancel}
            disabled={salvando}
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          className="admin-action-primary"
          disabled={salvando || !trilhas.length || inicial.modo === "invalido"}
        >
          {salvando ? "Salvando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
