import { buildCatalog, contentId } from './catalog';

describe('Importação da biblioteca para o banco', () => {
  const catalog = buildCatalog();

  it('preserva todas as aulas e cria atividades vinculadas a aulas reais', () => {
    const aulas = catalog.courses.flatMap(course => course.aulas);
    expect(catalog.courses).toHaveLength(12);
    expect(aulas).toHaveLength(91);
    expect(catalog.cenarios).toHaveLength(12);
    const ids = new Set(aulas.map(aula => aula.id));
    for (const cenario of catalog.cenarios) expect(ids.has(cenario.aulaId)).toBe(true);
    for (const aula of aulas) {
      expect(aula.quiz.questao.alternativas.filter(a => a.correta)).toHaveLength(1);
      expect(aula.quiz.questao.alternativas.length).toBeGreaterThanOrEqual(2);
      expect(aula.quiz.questao.explicacao.length).toBeGreaterThan(0);
    }
  });

  it('gera IDs estáveis e únicos para reimportar sem duplicar atividades', () => {
    expect(buildCatalog()).toEqual(catalog);
    expect(contentId('aula-1')).not.toEqual(contentId('aula-2'));
    const ids = catalog.courses.flatMap(course => [course.id, ...course.aulas.flatMap(aula => [
      aula.id, aula.quiz.id, aula.quiz.questao.id, ...aula.quiz.questao.alternativas.map(a => a.id),
    ])]).concat(catalog.cenarios.map(cenario => cenario.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('não publica questões, alternativas ou gabaritos no conteúdo das aulas', () => {
    for (const aula of catalog.courses.flatMap(course => course.aulas)) {
      const material = JSON.parse(aula.conteudo);
      expect(material.format).toBe('cybereduca-lesson-v1');
      for (const key of ['correct', 'question', 'options', 'explanation', 'expected', 'correta']) {
        expect(material).not.toHaveProperty(key);
      }
      expect(material.concept).toBeTruthy();
      expect(material.practice).toBeTruthy();
    }
  });
});
