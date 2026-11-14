// Conteúdo editorial carregado de Aula.conteudo. Gabaritos ficam em QuestaoQuiz.
export type LessonMaterial = {
  format: 'cybereduca-lesson-v1';
  level?: 'BASICO' | 'INTERMEDIARIO' | 'AVANCADO';
  glossary?: { term: string; meaning: string }[];
  title: string;
  concept: string;
  practice: string;
  source: string;
  sourceTitle: string;
  caseStudy?: string;
  expected?: string;
  objectives?: string[];
  supplement?: string;
  video?: { title: string; url: string; source: string; prompt: string };
  diagram?: { title: string; nodes: string[]; notes: string[]; caption: string };
  readings?: { title: string; url: string; task: string }[];
  introductory?: {
    step: number;
    image: { src: string; alt: string; caption: string };
    checkpoint: { question: string; options: string[]; correct: number; explanation: string };
    takeaway: string;
  };
};

export function parseLessonMaterial(content: string): LessonMaterial | null {
  if (!content.startsWith('{')) return null;
  try {
    const value = JSON.parse(content);
    return value?.format === 'cybereduca-lesson-v1' &&
      typeof value.concept === 'string' && typeof value.practice === 'string'
      ? value : null;
  } catch {
    return null;
  }
}
