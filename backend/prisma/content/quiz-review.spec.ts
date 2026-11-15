import { describe, expect, it } from '@jest/globals';
import { libraryCourses } from './course-library';
import { buildCatalog } from './catalog';
import { buildQuizReview } from './quiz-review';

describe('Revisão dos quizzes da plataforma', () => {
  it('completa todos os 91 quizzes com dez questões distintas e um único gabarito por questão', () => {
    const courses = buildCatalog().courses;
    const quizzes = courses.flatMap(course => course.aulas.map(aula => aula.quiz));
    expect(quizzes).toHaveLength(91);
    const ids: string[] = [];
    for (const quiz of quizzes) {
      const questions = [quiz.questao, ...quiz.revisoes];
      expect(questions.map(q => q.ordem)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(new Set(questions.map(q => q.enunciado.trim().toLocaleLowerCase('pt-BR'))).size).toBe(10);
      for (const question of questions) {
        expect(question.alternativas.length).toBeGreaterThanOrEqual(2);
        expect(question.alternativas.filter(a => a.correta)).toHaveLength(1);
        expect(new Set(question.alternativas.map(a => a.texto)).size).toBe(question.alternativas.length);
        expect(question.explicacao.trim().length).toBeGreaterThan(20);
        ids.push(question.id, ...question.alternativas.map(a => a.id));
      }
    }
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('usa referências apenas às aulas da mesma trilha, sem repetir a questão original', () => {
    for (const course of libraryCourses) for (const [index, lesson] of course.lessons.entries()) {
      const review = buildQuizReview(course, index);
      expect(review).toHaveLength(9);
      expect(review.every(q => course.lessons.some(source => source.id === q.sourceLessonId))).toBe(true);
      expect(review.some(q => q.enunciado === lesson.question)).toBe(false);
    }
  });

  it('mantém IDs e conteúdo determinísticos para permitir importação sem duplicações', () => {
    expect(buildCatalog()).toEqual(buildCatalog());
  });
});
