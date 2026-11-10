import { describe, expect, it, jest } from '@jest/globals';
import { AvaliacoesController } from './avaliacoes.controller';
import { AvaliacoesService } from './avaliacoes.service';

describe('AvaliacoesController', () => {
  it('encaminha o usuário autenticado aos métodos de tentativas', () => {
    const service = {
      listarMinhasTentativas: jest.fn().mockReturnValue([]),
      buscarResultadoProva: jest.fn().mockReturnValue({ tentativaId: 't1' }),
    };
    const controller = new AvaliacoesController(service as unknown as AvaliacoesService);

    expect(controller.listarMinhas({ user: { id: 'u1' } } as any)).toEqual([]);
    expect(service.listarMinhasTentativas).toHaveBeenCalledWith('u1');
    expect(controller.resultado('t1', { user: { id: 'u1' } } as any)).toEqual({ tentativaId: 't1' });
    expect(service.buscarResultadoProva).toHaveBeenCalledWith('t1', 'u1');
  });
});
