"use client";
import { LessonSources } from './lesson-sources';
import { useId, useState } from "react";
import { LessonExercise } from './lesson-exercise';
import ReactMarkdown from "react-markdown";
import type { LessonMaterial } from "@/lib/lesson-material";
import { IntroductoryLesson } from './introductory-lesson';
import { lessonHeadings } from '@/lib/lesson-headings';

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
  const [videoError, setVideoError] = useState(false);
  const unique = useId();
  const { video, diagram, supplement } = lesson;
  const headings = lessonHeadings(lesson);
  if (lesson.introductory) return <IntroductoryLesson lesson={lesson} />;
  return (
    <div className="lesson-learning-content">
      <h2>O que você vai aprender</h2>
      <ul>
        {lesson.objectives?.map((objective) => (
          <li key={objective}>{objective}</li>
        ))}
      </ul>
      {lesson.glossary && lesson.glossary.length > 0 && <section><h2>Termos desta aula</h2><dl>{lesson.glossary.map(item => <div key={item.term}><dt><strong>{item.term}</strong></dt><dd>{item.meaning}</dd></div>)}</dl></section>}
      <h2>{headings.concept}</h2>
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
      {lesson.caseStudy && lesson.caseStudy.trim() !== lesson.concept.trim() && <section>
        <h2>{headings.scenario}</h2>
        <ReactMarkdown>{lesson.caseStudy}</ReactMarkdown>
      </section>}
      {supplement && (
        <section className="lesson-deep-dive">
          <h2>Aplicação detalhada</h2>
          <SupplementMarkdown source={supplement} />
        </section>
      )}
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
          <p className="lesson-source-link">
            <a href={video.source} target="_blank" rel="noreferrer">
              Assistir e consultar a descrição acessível na página oficial
            </a>
          </p>
          <h3>Depois de assistir</h3>
          <p>{video.prompt}</p>
        </section>
      )}
      <h2>{lesson.level === 'BASICO' ? 'E você, o que faria?' : 'Atividade nesta página'}</h2>
      <ReactMarkdown>{lesson.practice}</ReactMarkdown>
      <LessonExercise aulaId={aulaId} />
      <LessonSources lesson={lesson} />
    </div>
  );
}
