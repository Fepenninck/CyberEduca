"use client";

import type { LessonMaterial } from "@/lib/lesson-material";
import { urlEditorialValida } from "@/lib/admin-lesson-editor";
import ReactMarkdown from "react-markdown";

export type AbaAula = "conteudo" | "apoio" | "previa";
type Props = {
  material: LessonMaterial;
  onChange: (material: LessonMaterial) => void;
};
function Texto({
  label,
  value = "",
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="admin-editor-field">
      {label}
      <textarea
        className="admin-control"
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
function Linha({
  label,
  value = "",
  onChange,
  url = false,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  url?: boolean;
}) {
  return (
    <label className="admin-editor-field">
      {label}
      <input
        className="admin-control"
        type={url ? "url" : "text"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={url ? "https://" : undefined}
      />
    </label>
  );
}
export function ConteudoEditorialAula({ material, onChange }: Props) {
  return (
    <div className="admin-editor-fields">
      <Texto
        label="Explicação principal"
        value={material.concept}
        onChange={(concept) => onChange({ ...material, concept })}
        rows={8}
        placeholder="Explique o assunto da aula com suas palavras, incluindo exemplos para o aluno."
      />
      <Texto
        label="O que o aluno vai aprender"
        value={(material.objectives ?? []).join("\n")}
        onChange={(value) =>
          onChange({ ...material, objectives: value.split("\n") })
        }
        rows={3}
        placeholder={"Escreva um objetivo por linha."}
      />
      <div className="admin-editor-two-columns">
        <Texto
          label="Exemplo ou estudo de caso"
          value={material.caseStudy}
          onChange={(caseStudy) => onChange({ ...material, caseStudy })}
          placeholder="Apresente uma situação que ajude o aluno a entender o assunto."
        />
        <Texto
          label="Orientação prática"
          value={material.practice}
          onChange={(practice) => onChange({ ...material, practice })}
          placeholder="Descreva o que o aluno deve observar ou praticar nesta aula."
        />
      </div>
    </div>
  );
}
export function RecursosEditoriaisAula({ material, onChange }: Props) {
  const video = material.video;
  const diagram = material.diagram;
  const intro = material.introductory;
  return (
    <div className="admin-resource-sections">
      <p className="admin-form-help">
        Estes recursos são opcionais. Abra apenas a seção que deseja editar.
      </p>
      <details className="admin-resource-section">
        <summary>
          <span>
            Vídeo complementar
            <small>
              {video?.title ||
                "Adicione um vídeo para acompanhar a explicação."}
            </small>
          </span>
        </summary>
        <div>
          {!video ? (
            <button
              className="admin-action-secondary"
              type="button"
              onClick={() =>
                onChange({
                  ...material,
                  video: { title: "", url: "", source: "", prompt: "" },
                })
              }
            >
              Adicionar vídeo
            </button>
          ) : (
            <>
              <div className="admin-editor-two-columns">
                <Linha
                  label="Título do vídeo"
                  value={video.title}
                  onChange={(title) =>
                    onChange({ ...material, video: { ...video, title } })
                  }
                />
                <Linha
                  label="Endereço do arquivo de vídeo (MP4)"
                  value={video.url}
                  url
                  onChange={(url) =>
                    onChange({ ...material, video: { ...video, url } })
                  }
                />
                <Linha
                  label="Página de origem do vídeo"
                  value={video.source}
                  url
                  onChange={(source) =>
                    onChange({ ...material, video: { ...video, source } })
                  }
                />
              </div>
              <Texto
                label="Orientação para assistir"
                value={video.prompt}
                onChange={(prompt) =>
                  onChange({ ...material, video: { ...video, prompt } })
                }
              />
              <button
                type="button"
                className="admin-resource-remove"
                onClick={() => {
                  const copia = { ...material };
                  delete copia.video;
                  onChange(copia);
                }}
              >
                Remover vídeo da aula
              </button>
            </>
          )}
        </div>
      </details>
      <details className="admin-resource-section">
        <summary>
          <span>
            Diagrama explicativo
            <small>
              {diagram?.title || "Organize a ideia da aula em etapas."}
            </small>
          </span>
        </summary>
        <div>
          {!diagram ? (
            <button
              className="admin-action-secondary"
              type="button"
              onClick={() =>
                onChange({
                  ...material,
                  diagram: {
                    title: "",
                    nodes: ["", "", ""],
                    notes: ["", "", ""],
                    caption: "",
                  },
                })
              }
            >
              Adicionar diagrama
            </button>
          ) : (
            <>
              <Linha
                label="Título do diagrama"
                value={diagram.title}
                onChange={(title) =>
                  onChange({ ...material, diagram: { ...diagram, title } })
                }
              />
              <div className="admin-diagram-editor">
                {diagram.nodes.map((node, index) => (
                  <div key={index}>
                    <span>Etapa {index + 1}</span>
                    <Linha
                      label="Nome da etapa"
                      value={node}
                      onChange={(value) =>
                        onChange({
                          ...material,
                          diagram: {
                            ...diagram,
                            nodes: diagram.nodes.map((item, i) =>
                              i === index ? value : item,
                            ),
                          },
                        })
                      }
                    />
                    <Linha
                      label="Explicação curta"
                      value={diagram.notes[index] ?? ""}
                      onChange={(value) => {
                        const notes = [...diagram.notes];
                        notes[index] = value;
                        onChange({
                          ...material,
                          diagram: { ...diagram, notes },
                        });
                      }}
                    />
                  </div>
                ))}
              </div>
              <Texto
                label="Legenda do diagrama"
                value={diagram.caption}
                rows={2}
                onChange={(caption) =>
                  onChange({ ...material, diagram: { ...diagram, caption } })
                }
              />
              <button
                type="button"
                className="admin-resource-remove"
                onClick={() => {
                  const copia = { ...material };
                  delete copia.diagram;
                  onChange(copia);
                }}
              >
                Remover diagrama da aula
              </button>
            </>
          )}
        </div>
      </details>
      <details className="admin-resource-section">
        <summary>
          <span>
            Fontes e leituras
            <small>Informe as referências e os materiais de consulta.</small>
          </span>
        </summary>
        <div>
          <div className="admin-editor-two-columns">
            <Linha
              label="Nome da fonte principal"
              value={material.sourceTitle}
              onChange={(sourceTitle) => onChange({ ...material, sourceTitle })}
            />
            <Linha
              label="Link da fonte principal"
              value={material.source}
              url
              onChange={(source) => onChange({ ...material, source })}
            />
          </div>
          {(material.readings ?? []).map((leitura, index) => (
            <div className="admin-editor-repeat" key={index}>
              <div className="admin-editor-two-columns">
                <Linha
                  label={`Leitura ${index + 1} — título`}
                  value={leitura.title}
                  onChange={(title) =>
                    onChange({
                      ...material,
                      readings: material.readings!.map((item, i) =>
                        i === index ? { ...item, title } : item,
                      ),
                    })
                  }
                />
                <Linha
                  label="Endereço da leitura"
                  value={leitura.url}
                  url
                  onChange={(url) =>
                    onChange({
                      ...material,
                      readings: material.readings!.map((item, i) =>
                        i === index ? { ...item, url } : item,
                      ),
                    })
                  }
                />
              </div>
              <Texto
                label="Orientação de leitura"
                rows={2}
                value={leitura.task}
                onChange={(task) =>
                  onChange({
                    ...material,
                    readings: material.readings!.map((item, i) =>
                      i === index ? { ...item, task } : item,
                    ),
                  })
                }
              />
              <button
                className="admin-resource-remove"
                type="button"
                onClick={() =>
                  onChange({
                    ...material,
                    readings: material.readings!.filter((_, i) => i !== index),
                  })
                }
              >
                Remover leitura
              </button>
            </div>
          ))}
          <button
            className="admin-action-secondary"
            type="button"
            onClick={() =>
              onChange({
                ...material,
                readings: [
                  ...(material.readings ?? []),
                  { title: "", url: "", task: "" },
                ],
              })
            }
          >
            Adicionar leitura
          </button>
        </div>
      </details>
      <details className="admin-resource-section">
        <summary>
          <span>
            Aprofundamento e glossário
            <small>
              Inclua material adicional e explique os termos da aula.
            </small>
          </span>
        </summary>
        <div>
          <Texto
            label="Material adicional"
            value={material.supplement}
            rows={6}
            onChange={(supplement) => onChange({ ...material, supplement })}
          />
          {(material.glossary ?? []).map((termo, index) => (
            <div className="admin-editor-repeat" key={index}>
              <div className="admin-editor-two-columns">
                <Linha
                  label="Termo"
                  value={termo.term}
                  onChange={(term) =>
                    onChange({
                      ...material,
                      glossary: material.glossary!.map((item, i) =>
                        i === index ? { ...item, term } : item,
                      ),
                    })
                  }
                />
                <Linha
                  label="Significado"
                  value={termo.meaning}
                  onChange={(meaning) =>
                    onChange({
                      ...material,
                      glossary: material.glossary!.map((item, i) =>
                        i === index ? { ...item, meaning } : item,
                      ),
                    })
                  }
                />
              </div>
              <button
                className="admin-resource-remove"
                type="button"
                onClick={() =>
                  onChange({
                    ...material,
                    glossary: material.glossary!.filter((_, i) => i !== index),
                  })
                }
              >
                Remover termo
              </button>
            </div>
          ))}
          <button
            type="button"
            className="admin-action-secondary"
            onClick={() =>
              onChange({
                ...material,
                glossary: [
                  ...(material.glossary ?? []),
                  { term: "", meaning: "" },
                ],
              })
            }
          >
            Adicionar termo
          </button>
        </div>
      </details>
      {intro && (
        <details className="admin-resource-section">
          <summary>
            <span>
              Material introdutório
              <small>
                Imagem, atividade livre e mensagem de encerramento desta aula.
              </small>
            </span>
          </summary>
          <div>
            <div className="admin-editor-two-columns">
              <Linha
                label="Endereço da imagem"
                value={intro.image.src}
                onChange={(src) =>
                  onChange({
                    ...material,
                    introductory: { ...intro, image: { ...intro.image, src } },
                  })
                }
              />
              <Linha
                label="Descrição da imagem"
                value={intro.image.alt}
                onChange={(alt) =>
                  onChange({
                    ...material,
                    introductory: { ...intro, image: { ...intro.image, alt } },
                  })
                }
              />
            </div>
            <Texto
              label="Legenda da imagem"
              rows={2}
              value={intro.image.caption}
              onChange={(caption) =>
                onChange({
                  ...material,
                  introductory: {
                    ...intro,
                    image: { ...intro.image, caption },
                  },
                })
              }
            />
            <Texto
              label="Pergunta da atividade livre"
              value={intro.checkpoint.question}
              onChange={(question) =>
                onChange({
                  ...material,
                  introductory: {
                    ...intro,
                    checkpoint: { ...intro.checkpoint, question },
                  },
                })
              }
            />
            {intro.checkpoint.options.map((opcao, index) => (
              <div className="admin-intro-option" key={index}>
                <label>
                  <input
                    type="radio"
                    name="resposta-introducao"
                    checked={intro.checkpoint.correct === index}
                    onChange={() =>
                      onChange({
                        ...material,
                        introductory: {
                          ...intro,
                          checkpoint: { ...intro.checkpoint, correct: index },
                        },
                      })
                    }
                  />
                  Correta
                </label>
                <Linha
                  label={`Opção ${index + 1}`}
                  value={opcao}
                  onChange={(value) =>
                    onChange({
                      ...material,
                      introductory: {
                        ...intro,
                        checkpoint: {
                          ...intro.checkpoint,
                          options: intro.checkpoint.options.map((item, i) =>
                            i === index ? value : item,
                          ),
                        },
                      },
                    })
                  }
                />
              </div>
            ))}
            <Texto
              label="Explicação da resposta"
              value={intro.checkpoint.explanation}
              onChange={(explanation) =>
                onChange({
                  ...material,
                  introductory: {
                    ...intro,
                    checkpoint: { ...intro.checkpoint, explanation },
                  },
                })
              }
            />
            <Texto
              label="Mensagem para levar para a próxima aula"
              value={intro.takeaway}
              onChange={(takeaway) =>
                onChange({ ...material, introductory: { ...intro, takeaway } })
              }
            />
          </div>
        </details>
      )}
    </div>
  );
}
function LinkSeguro({ url, titulo }: { url: string; titulo: string }) {
  return url.trim() && urlEditorialValida(url) ? (
    <a href={url} target="_blank" rel="noreferrer">
      {titulo || url}
    </a>
  ) : (
    <span>{titulo}</span>
  );
}
export function PreviaEditorialAula({
  material,
  titulo,
}: {
  material: LessonMaterial;
  titulo: string;
}) {
  return (
    <article className="admin-lesson-preview">
      <header>
        <span>Prévia do conteúdo</span>
        <h3>{titulo || "Título da aula"}</h3>
      </header>
      {material.introductory?.image.src &&
        urlEditorialValida(material.introductory.image.src, true) && (
          <figure>
            <img
              src={material.introductory.image.src}
              alt={material.introductory.image.alt}
            />
            <figcaption>{material.introductory.image.caption}</figcaption>
          </figure>
        )}
      {!!material.objectives?.filter((item) => item.trim()).length && (
        <section>
          <h4>O que o aluno vai aprender</h4>
          <ul>
            {material.objectives
              .filter((item) => item.trim())
              .map((item, index) => (
                <li key={index}>{item}</li>
              ))}
          </ul>
        </section>
      )}
      <section>
        {material.concept.trim() ? (
          <ReactMarkdown>{material.concept}</ReactMarkdown>
        ) : (
          <p className="admin-preview-empty">
            A explicação da aula aparecerá aqui quando você começar a escrever.
          </p>
        )}
      </section>
      {material.diagram && (
        <section>
          <h4>{material.diagram.title}</h4>
          <ol className="admin-diagram-preview">
            {material.diagram.nodes.map((node, index) => (
              <li key={index}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{node || "Nome da etapa"}</strong>
                <p>{material.diagram!.notes[index]}</p>
              </li>
            ))}
          </ol>
          <p>{material.diagram.caption}</p>
        </section>
      )}
      {material.caseStudy && (
        <section>
          <h4>Exemplo prático</h4>
          <ReactMarkdown>{material.caseStudy}</ReactMarkdown>
        </section>
      )}
      {material.supplement && (
        <section>
          <h4>Aprofundamento</h4>
          <ReactMarkdown>{material.supplement}</ReactMarkdown>
        </section>
      )}
      {material.video && (
        <section>
          <h4>{material.video.title || "Vídeo complementar"}</h4>
          {material.video.url && urlEditorialValida(material.video.url) && (
            <video controls preload="none" src={material.video.url} />
          )}
          <p>{material.video.prompt}</p>
          <LinkSeguro
            url={material.video.source}
            titulo="Consultar a fonte do vídeo"
          />
        </section>
      )}
      {material.practice && (
        <section>
          <h4>Colocando em prática</h4>
          <ReactMarkdown>{material.practice}</ReactMarkdown>
        </section>
      )}
      {!!material.glossary?.length && (
        <section>
          <h4>Glossário</h4>
          <dl>
            {material.glossary.map((item, index) => (
              <div key={index}>
                <dt>{item.term}</dt>
                <dd>{item.meaning}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      {material.introductory && (
        <section>
          <h4>Atividade introdutória</h4>
          <p>{material.introductory.checkpoint.question}</p>
          <ol>
            {material.introductory.checkpoint.options.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ol>
          <p>{material.introductory.takeaway}</p>
        </section>
      )}
      {material.source || material.readings?.length ? (
        <section className="admin-preview-sources">
          <h4>Fontes e leituras</h4>
          {material.source && (
            <p>
              <LinkSeguro url={material.source} titulo={material.sourceTitle} />
            </p>
          )}
          {material.readings?.map((item, index) => (
            <div key={index}>
              <LinkSeguro url={item.url} titulo={item.title} />
              <p>{item.task}</p>
            </div>
          ))}
        </section>
      ) : null}
      <p className="admin-form-help">
        Esta prévia mostra o conteúdo editorial. Atividades de quiz e progresso
        continuam disponíveis na página do aluno.
      </p>
    </article>
  );
}
