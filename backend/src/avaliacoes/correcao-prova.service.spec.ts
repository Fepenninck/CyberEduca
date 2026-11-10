import { describe, expect, it } from '@jest/globals';
import { CorrecaoProvaService } from './correcao-prova.service';

describe('CorrecaoProvaService', () => {
  const service = new CorrecaoProvaService();

  it('corrige respostas e calcula nota de zero a dez', () => {
    const resultado = service.corrigirProva(
      [
        { questaoId: 'q1', alternativaId: 'a-correta' },
        { questaoId: 'q2', alternativaId: 'b-errada' },
      ],
      [
        { questaoId: 'q1', alternativasValidas: new Set(['a-correta']), alternativaCorretaId: 'a-correta' },
        { questaoId: 'q2', alternativasValidas: new Set(['b-errada', 'b-correta']), alternativaCorretaId: 'b-correta' },
      ],
    );

    expect(resultado).toEqual({
      respostas: [
        { questaoId: 'q1', alternativaId: 'a-correta', acertou: true },
        { questaoId: 'q2', alternativaId: 'b-errada', acertou: false },
      ],
      totalQuestoes: 2,
      totalAcertos: 1,
      nota: 5,
    });
  });

  it('retorna nota zero para prova sem questões', () => {
    expect(service.calcularNota(0, 0)).toBe(0);
  });
});
