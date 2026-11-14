import { describe, expect, it, jest } from '@jest/globals';
import { AdminProvasController, ProvasController } from './provas.controller';
import { ProvasService } from './provas.service';

describe('ProvasController', () => {
  it('encaminha operações de aluno e administrador', () => {
    const service = {
      listarProvas: jest.fn().mockReturnValue([]), buscarProva: jest.fn().mockReturnValue({ id: 'p1' }),
      enviarTentativa: jest.fn().mockReturnValue({ id: 't1' }), statusDoAluno: jest.fn().mockReturnValue({}),
      corrigirRespostas: jest.fn().mockReturnValue({}), finalizarParaAluno: jest.fn().mockReturnValue({}),
      listarProvasAdmin: jest.fn().mockReturnValue([]), criarProva: jest.fn().mockReturnValue({ id: 'p1' }),
      atualizarProva: jest.fn().mockReturnValue({ id: 'p1' }), criarQuestao: jest.fn().mockReturnValue({ id: 'q1' }),
      criarAlternativa: jest.fn().mockReturnValue({ id: 'a1' }), publicarProva: jest.fn().mockReturnValue({}),
      arquivarProva: jest.fn().mockReturnValue({}), alterarStatusProva: jest.fn().mockReturnValue({}),
    };
    const student = new ProvasController(service as unknown as ProvasService);
    const admin = new AdminProvasController(service as unknown as ProvasService);
    const req = { user: { id: 'u1' } };
    const body = {} as any;

    student.listar('trilha-1'); student.buscar('p1'); student.enviarTentativa('p1', body, req);
    student.status('p1', req); student.corrigirRespostas('p1', req, { respostas: [] } as any);
    student.finalizar('p1', req, body);
    admin.listar(); admin.criar(body, req); admin.atualizar('p1', body, req); admin.criarQuestao('p1', body, req);
    admin.criarAlternativa('p1', 'q1', body, req);
    admin.alterarStatus('p1', { status: 'PUBLICADO' } as any, req);
    admin.alterarStatus('p1', { status: 'ARQUIVADO' } as any, req);
    admin.alterarStatus('p1', { status: 'RASCUNHO' } as any, req);

    expect(service.listarProvas).toHaveBeenCalledWith('trilha-1');
    expect(service.buscarProva).toHaveBeenCalledWith('p1');
    expect(service.enviarTentativa).toHaveBeenCalledWith('p1', 'u1', body);
    expect(service.statusDoAluno).toHaveBeenCalledWith('p1', 'u1');
    expect(service.corrigirRespostas).toHaveBeenCalledWith('p1', [], 'u1');
    expect(service.finalizarParaAluno).toHaveBeenCalledWith('p1', 'u1', body);
    expect(service.listarProvasAdmin).toHaveBeenCalled();
    expect(service.criarProva).toHaveBeenCalledWith(body, 'u1');
    expect(service.atualizarProva).toHaveBeenCalledWith('p1', body, 'u1');
    expect(service.criarQuestao).toHaveBeenCalledWith('p1', body, 'u1');
    expect(service.criarAlternativa).toHaveBeenCalledWith('p1', 'q1', body, 'u1');
    expect(service.publicarProva).toHaveBeenCalledWith('p1', 'u1');
    expect(service.arquivarProva).toHaveBeenCalledWith('p1', 'u1');
    expect(service.alterarStatusProva).toHaveBeenCalledWith('p1', 'RASCUNHO', 'u1');
  });
});
