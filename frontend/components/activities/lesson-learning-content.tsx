"use client";
import { useId, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import type { LessonMaterial } from "@/lib/lesson-material";

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

export function LessonLearningContent({
  lesson,
  aulaId,
  showDiagram,
}: {
  lesson: LessonMaterial;
  aulaId: string;
  showDiagram: boolean;
}) {
  const [solution, setSolution] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const unique = useId();
  const { video, diagram, supplement } = lesson;
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
          <ReactMarkdown>{lesson.expected || "Justifique sua análise com os conceitos da aula."}</ReactMarkdown>
          <ul>
            <li>A resposta resolve o pedido específico da atividade?</li>
            <li>Você distinguiu uma evidência de uma hipótese?</li>
            <li>O procedimento pode ser repetido e seu resultado conferido?</li>
            <li>Você explicou pelo menos uma limitação da solução?</li>
          </ul>
        </div>
      )}
      <h2>Teste sua compreensão</h2>
      <Link className="lesson-review-button" href={`/quizzes?aulaId=${encodeURIComponent(aulaId)}`}>Responder o quiz desta aula</Link>
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
      {lesson.readings?.map((reading) => (
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
