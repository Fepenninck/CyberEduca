import { describe, expect, it, jest } from '@jest/globals';
import { SimulacoesController } from './simulacoes.controller';
import { SimulacoesService } from './simulacoes.service';

describe('SimulacoesController', () => {
  it('encaminha consultas, respostas e finalização do aluno', () => {
    const service = {
      listarParaAluno: jest.fn().mockReturnValue([]), listarCategoriasParaAluno: jest.fn().mockReturnValue([]),
      buscarCategoriaParaAluno: jest.fn().mockReturnValue({ id: 'c1' }), buscarParaAluno: jest.fn().mockReturnValue({ id: 's1' }),
      statusDoAluno: jest.fn().mockReturnValue({ concluida: false }), responder: jest.fn().mockReturnValue({}),
      finalizarParaAluno: jest.fn().mockReturnValue({ jaConcluida: false }),
    };
    const controller = new SimulacoesController(service as unknown as SimulacoesService);
    const req = { user: { id: 'u1' } };
    const body = { respostas: [] } as any;

    controller.listar(); controller.listarCategorias(); controller.buscarCategoria('c1', req);
    controller.buscar('s1', req); controller.status('s1', req); controller.responder('s1', req, body);
    controller.finalizar('s1', req, body);

    expect(service.listarParaAluno).toHaveBeenCalled();
    expect(service.listarCategoriasParaAluno).toHaveBeenCalled();
    expect(service.buscarCategoriaParaAluno).toHaveBeenCalledWith('c1', 'u1');
    expect(service.buscarParaAluno).toHaveBeenCalledWith('s1', 'u1');
    expect(service.statusDoAluno).toHaveBeenCalledWith('s1', 'u1');
    expect(service.responder).toHaveBeenCalledWith('s1', [], 'u1');
    expect(service.finalizarParaAluno).toHaveBeenCalledWith('s1', 'u1', body);
  });
});
