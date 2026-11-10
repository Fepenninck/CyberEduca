import { describe, expect, it, jest } from '@jest/globals';
import { AulasController, ProgressoController, TrilhasController } from './aprendizagem.controller';
import { AprendizagemService } from './aprendizagem.service';

describe('Aprendizagem controllers', () => {
  it('encaminha trilhas, aulas e progresso ao service', () => {
    const service = {
      listarTrilhas: jest.fn().mockReturnValue([]), criarTrilha: jest.fn().mockReturnValue({ id: 't1' }),
      editarTrilha: jest.fn().mockReturnValue({ id: 't1' }), detalharTrilha: jest.fn().mockReturnValue({ id: 't1' }),
      buscarAula: jest.fn().mockReturnValue({ id: 'a1' }), criarAula: jest.fn().mockReturnValue({ id: 'a1' }),
      editarAula: jest.fn().mockReturnValue({ id: 'a1' }), concluirAula: jest.fn().mockReturnValue({ concluida: true }),
      progressoGeral: jest.fn().mockReturnValue({ percentual: 50 }),
    };
    const trilhas = new TrilhasController(service as unknown as AprendizagemService);
    const aulas = new AulasController(service as unknown as AprendizagemService);
    const progresso = new ProgressoController(service as unknown as AprendizagemService);
    const req = { user: { id: 'u1' } };
    const body = { titulo: 'Conteúdo', descricao: 'Descrição', ordem: 1 };

    trilhas.listar(req); trilhas.criar(body); trilhas.editar('t1', body); trilhas.detalhar('t1', req);
    aulas.buscar('a1', req); aulas.criar({ ...body, conteudo: 'Aula', trilhaId: 't1' });
    aulas.editar('a1', body); aulas.concluir('a1', req); progresso.geral(req);

    expect(service.listarTrilhas).toHaveBeenCalledWith('u1');
    expect(service.criarTrilha).toHaveBeenCalledWith(body);
    expect(service.editarTrilha).toHaveBeenCalledWith('t1', body);
    expect(service.detalharTrilha).toHaveBeenCalledWith('t1', 'u1');
    expect(service.buscarAula).toHaveBeenCalledWith('a1', 'u1');
    expect(service.criarAula).toHaveBeenCalled();
    expect(service.editarAula).toHaveBeenCalledWith('a1', body);
    expect(service.concluirAula).toHaveBeenCalledWith('a1', 'u1');
    expect(service.progressoGeral).toHaveBeenCalledWith('u1');
  });
});
