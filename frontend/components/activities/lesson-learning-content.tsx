"use client";
import { useId, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { LibraryLesson } from "@/lib/course-library";
import { lessonSupplements } from "@/lib/lesson-supplements";

function SupplementMarkdown({ source }: { source: string }) {
  const blocks = source.split(/(^\|[^\n]+\|(?:\n\|[^\n]+\|)+)/gm);
  return (
    <>
      {blocks.map((block, index) => {
        const lines = block.trim().split("\n");
        if (!block.startsWith("|") || !lines[1]?.match(/^\|[\s:|\-]+\|$/))
          return <ReactMarkdown key={index}>{block}</ReactMarkdown>;
        const cells = (line: string) =>
          line
            .trim()
            .slice(1, -1)
            .split("|")
            .map((value) => value.trim());
        return (
          <div className="lesson-table-wrap" key={index}>
            <table>
              <thead>
                <tr>
                  {cells(lines[0]).map((cell, i) => (
                    <th key={i} scope="col">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lines.slice(2).map((line, i) => (
                  <tr key={i}>
                    {cells(line).map((cell, j) => (
                      <td key={j}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </>
  );
}
import {
  lessonVideos,
  courseDiagrams,
  courseReadings,
} from "@/lib/lesson-media";

export function LessonLearningContent({
  lesson,
  courseId,
  showDiagram,
}: {
  lesson: LibraryLesson;
  courseId: string;
  showDiagram: boolean;
}) {
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [notes, setNotes] = useState("");
  const [solution, setSolution] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const unique = useId();
  const video = lessonVideos[`${courseId}/${lesson.id}`];
  const diagram = courseDiagrams[courseId];
  const supplement = lessonSupplements[`${courseId}/${lesson.id}`];
  return (
    <div className="lesson-learning-content">
      <h2>O que você vai aprender</h2>
      <ul>
        {lesson.objectives?.map((objective) => (
          <li key={objective}>{objective}</li>
        ))}
      </ul>
      <h2>Entenda o conceito</h2>
      <ReactMarkdown>{lesson.concept}</ReactMarkdown>
      {showDiagram && diagram && (
        <figure className="lesson-teaching-figure">
          <svg
            viewBox="0 0 760 170"
            role="img"
            aria-labelledby={`${unique}-title ${unique}-description`}
          >
            <title id={`${unique}-title`}>{diagram.title}</title>
            <desc id={`${unique}-description`}>
              {diagram.nodes
                .map((node, i) => `${node}: ${diagram.notes[i]}`)
                .join(". ")}
            </desc>
            {diagram.nodes.map((node, i) => (
              <g key={node}>
                <rect
                  x={i * 253 + 5}
                  y="24"
                  width="225"
                  height="112"
                  rx="9"
                  fill="#172b40"
                  stroke="#4a6079"
                />
                <text
                  x={i * 253 + 22}
                  y="52"
                  fill="#b2ff00"
                  fontSize="13"
                  fontFamily="Arial"
                >
                  0{i + 1}
                </text>
                <text
                  x={i * 253 + 22}
                  y="79"
                  fill="#f1f6fb"
                  fontSize="15"
                  fontWeight="bold"
                  fontFamily="Arial"
                >
                  {node}
                </text>
                <text
                  x={i * 253 + 22}
                  y="108"
                  fill="#a4b8d0"
                  fontSize="11"
                  fontFamily="Arial"
                >
                  {diagram.notes[i]}
                </text>
                {i < 2 && (
                  <path
                    d={`M ${i * 253 + 235} 80 h 15 m -5 -5 l 5 5 -5 5`}
                    fill="none"
                    stroke="#b2ff00"
                    strokeWidth="2"
                  />
                )}
              </g>
            ))}
          </svg>
          <figcaption>
            <strong>{diagram.title}.</strong> {diagram.caption} Ilustração
            didática original do CyberEduca+.
          </figcaption>
        </figure>
      )}
      <h2>Caso explicado, passo a passo</h2>
      <ReactMarkdown>{lesson.caseStudy || lesson.concept}</ReactMarkdown>
      {supplement && (
        <section className="lesson-deep-dive">
          <h2>Aplicação detalhada</h2>
          <SupplementMarkdown source={supplement} />
        </section>
      )}
      <h3>Como analisar este caso</h3>
      <ol>
        <li>
          <strong>Identifique o que precisa ser protegido.</strong> Separe
          conta, informação, equipamento e operação; eles podem exigir controles
          diferentes.
        </li>
        <li>
          <strong>Descreva a condição de risco.</strong> Use os fatos do caso e
          registre quais informações ainda faltam.
        </li>
        <li>
          <strong>Justifique o controle escolhido.</strong> Explique como ele
          reduz o risco e o que permanece fora de sua proteção.
        </li>
        <li>
          <strong>Defina uma evidência de verificação.</strong> Diga o que você
          observaria para confirmar o resultado, sem depender somente da
          aparência da tela.
        </li>
      </ol>
      {video && (
        <section className="lesson-video-material">
          <h2>Vídeo complementar</h2>
          <p>{video.title}</p>
          {!videoError && (
            <video
              controls
              preload="none"
              playsInline
              onError={() => setVideoError(true)}
              aria-label={video.title}
            >
              <source src={video.url} type="video/mp4" />
              Seu navegador não conseguiu reproduzir este vídeo.
            </video>
          )}
          {videoError && (
            <p role="status">
              A reprodução não ficou disponível aqui. Você pode assistir na
              página oficial abaixo.
            </p>
          )}
          <p>
            <a href={video.source} target="_blank" rel="noreferrer">
              Assistir e consultar a descrição acessível na página oficial
            </a>
          </p>
          <p className="lesson-media-credit">
            Produção: NIC.br / Cidadão na Rede. Material original, sem edição;
            licença indicada na fonte: CC BY-ND. A reprodução depende da
            disponibilidade do provedor.
          </p>
          <h3>Depois de assistir</h3>
          <p>{video.prompt}</p>
        </section>
      )}
      <h2>Oficina prática</h2>
      <ReactMarkdown>{lesson.practice}</ReactMarkdown>
      <p>
        Use exemplos fictícios ou um ambiente seu e autorizado. Nos exercícios
        de análise, não é necessário executar ataques, abrir arquivos suspeitos
        ou alterar sistemas de terceiros.
      </p>
      <label htmlFor={`${unique}-notes`}>
        <strong>Sua entrega</strong>
      </label>
      <textarea
        id={`${unique}-notes`}
        className="lesson-practice-notes"
        rows={5}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Registre sua análise, a decisão, a evidência e as limitações..."
      />
      <p className="lesson-media-credit">
        Este rascunho é temporário e não é enviado ao servidor. Copie o texto se
        quiser guardá-lo antes de mudar de aula.
      </p>
      <button
        className="lesson-review-button"
        onClick={() => setSolution((value) => !value)}
        aria-expanded={solution}
      >
        {solution ? "Ocultar critérios de revisão" : "Conferir minha entrega"}
      </button>
      {solution && (
        <div className="lesson-review-box">
          <h3>Critérios para revisar</h3>
          <ReactMarkdown>{lesson.expected || lesson.explanation}</ReactMarkdown>
          <ul>
            <li>A resposta resolve o pedido específico da atividade?</li>
            <li>Você distinguiu uma evidência de uma hipótese?</li>
            <li>O procedimento pode ser repetido e seu resultado conferido?</li>
            <li>Você explicou pelo menos uma limitação da solução?</li>
          </ul>
        </div>
      )}
      <h2>Teste sua compreensão</h2>
      <fieldset className="lesson-checkpoint">
        <legend>{lesson.question}</legend>
        {lesson.options.map((option, i) => (
          <label key={option}>
            <input
              type="radio"
              name={`${unique}-answer`}
              checked={choice === i}
              onChange={() => {
                setChoice(i);
                setChecked(false);
              }}
            />
            {option}
          </label>
        ))}
        <button
          className="lesson-review-button"
          disabled={choice === null}
          onClick={() => setChecked(true)}
        >
          Conferir resposta
        </button>
        {checked && (
          <p role="status">
            <strong>
              {choice === lesson.correct
                ? "Resposta correta."
                : "Vamos revisar."}
            </strong>{" "}
            {lesson.explanation}
            {choice !== lesson.correct &&
              ` Resposta esperada: ${lesson.options[lesson.correct]}`}
          </p>
        )}
      </fieldset>
      <h2>Referências e leitura guiada</h2>
      <p>
        Explicações e casos didáticos originais do CyberEduca+. Os materiais
        abaixo são fontes complementares oficiais; os casos fictícios não são
        relatos de incidentes reais.
      </p>
      <p>
        <a href={lesson.source} target="_blank" rel="noreferrer">
          {lesson.sourceTitle}
        </a>
      </p>
      <p>
        Na leitura oficial, localize uma recomendação relacionada a esta aula.
        Explique com suas palavras como aplicá-la ao exercício e em que situação
        ela seria insuficiente.
      </p>
      {courseReadings[courseId]?.map((reading) => (
        <div key={reading.url}>
          <p>
            <a href={reading.url} target="_blank" rel="noreferrer">
              {reading.title}
            </a>
          </p>
          <p>{reading.task}</p>
        </div>
      ))}
      <h3>Antes de concluir</h3>
      <ul>
        <li>Consigo explicar o conceito sem repetir a definição?</li>
        <li>Consigo justificar a resposta do caso com um motivo técnico?</li>
        <li>Produzi a entrega prática e conferi os critérios de revisão?</li>
        <li>
          Sei diferenciar o que o controle protege e o que continua exigindo
          cuidado?
        </li>
      </ul>
    </div>
  );
}
