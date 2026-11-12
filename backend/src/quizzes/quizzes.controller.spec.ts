import { describe, expect, it, jest } from '@jest/globals';
import { AdminQuizzesController, QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';

describe('QuizzesController', () => {
  it('encaminha operações de aluno e administração', () => {
    const service = {
      listarQuizzes: jest.fn().mockReturnValue([]), buscarQuiz: jest.fn().mockReturnValue({ id: 'q1' }),
      responderQuiz: jest.fn().mockReturnValue({ concluido: true }), listarQuizzesAdmin: jest.fn().mockReturnValue([]),
      criarQuiz: jest.fn().mockReturnValue({ id: 'q1' }), atualizarQuiz: jest.fn().mockReturnValue({ id: 'q1' }),
      criarQuestao: jest.fn().mockReturnValue({ id: 'questao-1' }), criarAlternativa: jest.fn().mockReturnValue({ id: 'a1' }),
      publicarQuiz: jest.fn().mockReturnValue({ status: 'PUBLICADO' }), arquivarQuiz: jest.fn().mockReturnValue({ status: 'ARQUIVADO' }),
    };
    const student = new QuizzesController(service as unknown as QuizzesService);
    const admin = new AdminQuizzesController(service as unknown as QuizzesService);
    const dto = {} as any;

    const req = { user: { id: 'u1' } } as any;
    student.listar(req, 'a1'); student.buscar(req, 'q1'); student.responder({ user: { id: 'u1' } } as any, 'q1', dto);
    admin.listar(); admin.criar(dto); admin.atualizar('q1', dto); admin.criarQuestao('q1', dto);
    admin.criarAlternativa('q1', 'questao-1', dto); admin.atualizarStatus('q1', { status: 'PUBLICADO' } as any);
    admin.atualizarStatus('q1', { status: 'ARQUIVADO' } as any);

    expect(service.listarQuizzes).toHaveBeenCalledWith('a1', 'u1');
    expect(service.buscarQuiz).toHaveBeenCalledWith('q1', 'u1');
    expect(service.responderQuiz).toHaveBeenCalledWith('u1', 'q1', dto);
    expect(service.listarQuizzesAdmin).toHaveBeenCalled();
    expect(service.criarQuiz).toHaveBeenCalledWith(dto);
    expect(service.atualizarQuiz).toHaveBeenCalledWith('q1', dto);
    expect(service.criarQuestao).toHaveBeenCalledWith('q1', dto);
    expect(service.criarAlternativa).toHaveBeenCalledWith('q1', 'questao-1', dto);
    expect(service.publicarQuiz).toHaveBeenCalledWith('q1');
    expect(service.arquivarQuiz).toHaveBeenCalledWith('q1');
  });
});
