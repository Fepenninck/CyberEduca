import { createHash } from 'node:crypto';
import { libraryCourses } from './course-library';
import { localScenarios } from './phishing';
import { lessonSupplements } from './lesson-supplements';
import { lessonVideos, courseDiagrams, courseReadings } from './lesson-media';
import { glossary, basicLessonDiagram } from './learning-levels';
import { technicalExample } from './technical-examples';
import { specificDiagram } from './lesson-specific-material';

// Stable UUIDs make imports repeatable without deleting records or attempts.
export function contentId(key: string): string {
  const bytes = createHash('sha256').update(`cybereduca-library-v1:${key}`).digest();
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.subarray(0, 16).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function buildCatalog() {
  const courses = libraryCourses.map((course) => ({
    id: contentId(course.id),
    titulo: course.title,
    descricao: course.description,
    nivel: course.level,
    aulas: course.lessons.map((lesson, index) => {
      const key = `${course.id}/${lesson.id}`;
      const diagram = course.level === 'BASICO' ? basicLessonDiagram(course.id, index, lesson.title) : specificDiagram(course.id, index, lesson.title);
      return {
        id: contentId(key),
        titulo: lesson.title,
        ordem: index + 1,
        conteudo: JSON.stringify({
          format: 'cybereduca-lesson-v1',
          level: course.level,
          title: lesson.title,
          concept: lesson.concept,
          practice: `Acompanhe o exemplo de “${lesson.title}”. Observe a relação entre ${diagram.nodes[0].toLowerCase()} e ${diagram.nodes[1].toLowerCase()}; depois, escolha uma resposta na atividade desta página. A correção aparece aqui no site.`,
          source: lesson.source,
          sourceTitle: lesson.sourceTitle,
          caseStudy: lesson.caseStudy,
          objectives: [`Compreender ${lesson.title.charAt(0).toLowerCase() + lesson.title.slice(1)}.`, `Relacionar ${diagram.nodes[0].toLowerCase()}, ${diagram.nodes[1].toLowerCase()} e ${diagram.nodes[2].toLowerCase()} no exemplo apresentado.`],
          // Do not include expected/explanation: some contain the checkpoint answer.
          supplement: course.level === 'BASICO' ? undefined : [
            lessonSupplements[key]?.split(/\n\n/).filter(paragraph => !/exercício|entrega|produza|instale|execute|desenhe/i.test(paragraph)).join('\n\n'),
            course.level === 'AVANCADO' ? technicalExample(course.id, index) : undefined,
          ].filter(Boolean).join('\n\n'),
          glossary: course.level === 'INTERMEDIARIO' ? Object.entries(glossary)
            .filter(([term]) => new RegExp(`\\b${term}\\b`, 'i').test(JSON.stringify([lesson, courseDiagrams[course.id], lessonSupplements[key]])))
            .map(([term, meaning]) => ({ term, meaning })) : undefined,
          video: lessonVideos[key] ? {
            ...lessonVideos[key],
            prompt: course.level === 'BASICO' ? 'Observe uma situação do vídeo e pense no cuidado que ajudaria a pessoa. Você responde à atividade nesta página.' : lessonVideos[key].prompt,
          } : undefined,
          diagram,
          readings: course.level === 'BASICO' ? undefined : courseReadings[course.id],
        }),
        quiz: {
          id: contentId(`pedagogia-v2/${contentId(key)}`),
          titulo: `Prática — ${lesson.title}`,
          descricao: `Revise os conceitos da aula ${lesson.title}.`,
          questao: {
            id: contentId(`question/${key}`),
            enunciado: lesson.question,
            explicacao: lesson.explanation,
            ordem: 1,
            alternativas: lesson.options.map((texto, i) => ({
              id: contentId(`answer/${key}/${i}`), texto,
              correta: i === lesson.correct, ordem: i + 1,
            })),
          },
        },
      };
    }),
  }));
  const phishingCourse = courses.find(course => course.id === contentId('biblioteca-golpes'));
  if (!phishingCourse) throw new Error('Aulas de phishing não encontradas.');
  const cenarios = localScenarios.map((cenario, index) => ({
    id: contentId(`scenario/${cenario.id}`),
    titulo: cenario.titulo,
    descricao: cenario.descricao,
    conteudoMensagem: cenario.conteudoMensagem,
    tipo: cenario.tipo,
    ehPhishing: cenario.phishing,
    explicacao: cenario.explanation,
    aulaId: phishingCourse.aulas[index % phishingCourse.aulas.length].id,
  }));
  return { courses, cenarios };
}
