import { describe, expect, it } from '@jest/globals';
import { buildCatalog, contentId } from './catalog';
import { lessonEditorial } from './lesson-editorial';

describe('Revisão editorial das aulas', () => {
  const aulas = buildCatalog().courses.flatMap(course => course.aulas);

  it('cobre cada aula com explicação, caso, reflexão e síntese específicos', () => {
    expect(aulas).toHaveLength(91);
    expect(Object.keys(lessonEditorial)).toHaveLength(aulas.length);
    const reflexoes = new Set<string>();
    const sinteses = new Set<string>();
    for (const aula of aulas) {
      const material = JSON.parse(aula.conteudo);
      expect(material.concept.split('\n\n').length).toBeGreaterThanOrEqual(3);
      expect(material.caseStudy.split('\n\n').length).toBeGreaterThanOrEqual(2);
      expect(material.practice).not.toMatch(/atividade (desta página|nesta página|abaixo)|correção aparece aqui/i);
      expect(material.practice).not.toContain('Acompanhe o exemplo de');
      reflexoes.add(material.practice);
      sinteses.add(material.takeaway);
    }
    expect(reflexoes.size).toBe(aulas.length);
    expect(sinteses.size).toBe(aulas.length);
  });

  it('explica cuidados e limites em assuntos básicos, intermediários e avançados', () => {
    const material = (titulo: string) => JSON.parse(aulas.find(aula => aula.titulo === titulo)!.conteudo);
    expect(material('Uma senha diferente para cada conta').concept).toContain('gerenciador');
    expect(material('Uma cópia precisa poder ser aberta').practice).toContain('restaurar');
    expect(material('TLS, certificados e limites do cadeado').concept).toContain('não certifica a honestidade');
    expect(material('Autenticar não é autorizar').concept).toContain('Ocultar um botão não impede');
    expect(material('Consultas parametrizadas na prática').concept).toContain('nomes de tabela');
  });

  it('mantém IDs determinísticos, questões e mídias no catálogo', () => {
    const contas = aulas.find(aula => aula.id === contentId('biblioteca-contas/aula-1'))!;
    expect(contas).toBeDefined();
    expect(contas.quiz.revisoes).toHaveLength(9);
    expect(contas.quiz.questao.enunciado).toBeDefined();
    expect(contas.quiz.id).toBe(contentId(`pedagogia-v2/${contas.id}`));
    for (const aula of aulas) {
      const material = JSON.parse(aula.conteudo);
      expect(material.diagram.nodes).toHaveLength(3);
      expect(material.source).toMatch(/^https:\/\//);
      if (material.video) {
        expect(material.video.url).toMatch(/^https:\/\//);
        expect(material.video.prompt).not.toContain('atividade nesta página');
      }
    }
  });
});
