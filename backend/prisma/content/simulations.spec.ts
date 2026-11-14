import { describe, expect, it } from '@jest/globals';
import { SIMULATION_SEEDS } from './simulations';

describe('Catálogo de simulações práticas', () => {
  it('oferece temas distintos e os três níveis de dificuldade', () => {
    expect(SIMULATION_SEEDS).toHaveLength(12);
    expect(new Set(SIMULATION_SEEDS.map(item => item.key)).size).toBe(12);
    expect(new Set(SIMULATION_SEEDS.map(item => item.categoria)).size).toBe(6);
    expect(new Set(SIMULATION_SEEDS.map(item => item.nivel))).toEqual(new Set(['BASICO', 'INTERMEDIARIO', 'AVANCADO']));
  });
  it('inclui contexto e feedback próprios em cada decisão, sem alternativas repetidas', () => {
    const contexts: string[] = [];
    for (const simulation of SIMULATION_SEEDS) {
      expect(simulation.decisoes).toHaveLength(3);
      for (const decision of simulation.decisoes) {
        expect(decision.contexto.length).toBeGreaterThan(40);
        expect(decision.explicacao.length).toBeGreaterThan(60);
        expect(new Set([decision.correta, ...decision.outras]).size).toBe(3);
        contexts.push(decision.contexto);
      }
    }
    expect(new Set(contexts).size).toBe(contexts.length);
  });
  it('reserva código e análise técnica para os níveis acima do básico', () => {
    for (const simulation of SIMULATION_SEEDS.filter(item => item.nivel === 'BASICO')) {
      expect(JSON.stringify(simulation)).not.toMatch(/SELECT |GET \/api|SQL|db\.query|proprietarioId/);
    }
    expect(SIMULATION_SEEDS.some(item => item.nivel === 'AVANCADO' && item.categoria === 'Código seguro')).toBe(true);
  });
});
