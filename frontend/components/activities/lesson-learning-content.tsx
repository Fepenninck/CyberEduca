"use client";
import { LessonSources } from './lesson-sources';
import ReactMarkdown from "react-markdown";
import type { LessonMaterial } from "@/lib/lesson-material";
import { IntroductoryLesson } from './introductory-lesson';
import { lessonHeadings } from '@/lib/lesson-headings';
import { apresentarOrientacao } from '@/lib/lesson-presentation';
import './lesson-presentation.css';
import { CheckCircle2 } from 'lucide-react';
import { LessonDiagram, LessonVideo } from './lesson-media';

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
  showDiagram,
}: {
  lesson: LessonMaterial;
  aulaId: string;
  showDiagram: boolean;
}) {
  const { video, diagram, supplement } = lesson;
  const headings = lessonHeadings(lesson);
  if (lesson.introductory) return <IntroductoryLesson lesson={lesson} />;
  return (
    <div className="lesson-learning-content space-y-8">
      {lesson.objectives && lesson.objectives.length > 0 && <section>
        <h2>O que você vai aprender</h2>
        <ul>
          {lesson.objectives.map((objective) => (
            <li key={objective}>{objective}</li>
          ))}
        </ul>
      </section>}
      {lesson.glossary && lesson.glossary.length > 0 && <section><h2>Termos desta aula</h2><dl>{lesson.glossary.map(item => <div key={item.term}><dt><strong>{item.term}</strong></dt><dd>{item.meaning}</dd></div>)}</dl></section>}
      <section>
        <h2>{headings.concept}</h2>
        <ReactMarkdown>{lesson.concept}</ReactMarkdown>
      </section>
      {showDiagram && diagram && <LessonDiagram diagram={diagram} />}
      {lesson.caseStudy && lesson.caseStudy.trim() !== lesson.concept.trim() && <section className="rounded-2xl bg-sky-300/5 p-5">
        <h3 className="!mt-0">{headings.scenario}</h3>
        <ReactMarkdown>{lesson.caseStudy}</ReactMarkdown>
      </section>}
      {supplement && (
        <section className="lesson-deep-dive">
          <h2>Aplicação detalhada</h2>
          <SupplementMarkdown source={supplement} />
        </section>
      )}
      {video && <LessonVideo key={video.url} video={video} />}
      <section className="rounded-2xl bg-[#b2ff00]/5 p-5">
        <h2 className="!mt-0">Para refletir</h2>
        <ReactMarkdown>{apresentarOrientacao(lesson.practice)}</ReactMarkdown>
      </section>
      {lesson.takeaway && <aside className="flex items-start gap-3 rounded-xl bg-sky-300/10 p-5"><CheckCircle2 className="mt-1 shrink-0 text-sky-300" size={22} aria-hidden="true" /><div><strong>Para levar para a próxima aula</strong><p className="!mb-0">{lesson.takeaway}</p></div></aside>}
      <LessonSources lesson={lesson} />
    </div>
  );
}
