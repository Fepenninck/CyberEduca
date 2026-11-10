import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PrismaService } from '../prisma.service';
import { QuizzesService } from './quizzes.service';

describe('QuizzesService', () => {
  const prismaMock = {
    quiz: {
      findMany: jest.fn<(...args: any[]) => Promise<any>>(),
      findFirst: jest.fn<(...args: any[]) => Promise<any>>(),
      findUnique: jest.fn<(...args: any[]) => Promise<any>>(),
      create: jest.fn<(...args: any[]) => Promise<any>>(),
      update: jest.fn<(...args: any[]) => Promise<any>>(),
    },
    aula: { findUnique: jest.fn<(...args: any[]) => Promise<any>>() },
    questaoQuiz: {
      findMany: jest.fn<(...args: any[]) => Promise<any>>(),
      count: jest.fn<(...args: any[]) => Promise<number>>(),
      create: jest.fn<(...args: any[]) => Promise<any>>(),
    },
    alternativaQuiz: { create: jest.fn<(...args: any[]) => Promise<any>>() },
    tentativaQuiz: { create: jest.fn<(...args: any[]) => Promise<any>>() },
    $transaction: jest.fn<(...args: any[]) => Promise<any>>(),
  };
  let service: QuizzesService;

  beforeEach(() => {
    jest.resetAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback: any) => callback(prismaMock));
    service = new QuizzesService(prismaMock as unknown as PrismaService);
  });

  it('lista quizzes administrativos e quizzes publicados', async () => {
    prismaMock.quiz.findMany.mockResolvedValue([{ id: 'quiz-1' }]);
    await expect(service.listarQuizzesAdmin()).resolves.toEqual([{ id: 'quiz-1' }]);
    await expect(service.listarQuizzes('aula-1')).resolves.toEqual([{ id: 'quiz-1' }]);
    expect(prismaMock.quiz.findMany).toHaveBeenCalledTimes(2);
  });

  it('cria um quiz após confirmar que a aula existe', async () => {
    prismaMock.aula.findUnique.mockResolvedValue({ id: 'aula-1' });
    prismaMock.quiz.create.mockResolvedValue({ id: 'quiz-1', titulo: 'Boas práticas' });

    await expect(service.criarQuiz({ titulo: 'Boas práticas', descricao: 'Conceitos', aulaId: 'aula-1' } as any))
      .resolves.toEqual({ id: 'quiz-1', titulo: 'Boas práticas' });
    expect(prismaMock.quiz.create).toHaveBeenCalled();
  });

  it('publica quiz rascunho com questão e gabarito válidos', async () => {
    prismaMock.quiz.findUnique.mockResolvedValue({ id: 'quiz-1', status: 'RASCUNHO' });
    prismaMock.questaoQuiz.findMany.mockResolvedValue([{
      ordem: 1,
      alternativas: [{ correta: true }, { correta: false }],
    }]);
    prismaMock.quiz.update.mockResolvedValue({ id: 'quiz-1', status: 'PUBLICADO' });

    await expect(service.publicarQuiz('quiz-1')).resolves.toEqual({ id: 'quiz-1', status: 'PUBLICADO' });
    expect(prismaMock.quiz.update).toHaveBeenCalledWith({
      where: { id: 'quiz-1' }, data: { status: 'PUBLICADO' },
    });
  });

  it('corrige respostas e registra tentativa do aluno', async () => {
    prismaMock.quiz.findFirst.mockResolvedValue({
      id: 'quiz-1',
      questoes: [{
        id: 'q1', ordem: 1, explicacao: 'A autenticação protege a conta.',
        alternativas: [{ id: 'alt1', correta: true }, { id: 'alt2', correta: false }],
      }],
    });
    prismaMock.tentativaQuiz.create.mockResolvedValue({
      id: 'tentativa-1', totalQuestoes: 1, totalAcertos: 1,
    });

    await expect(service.responderQuiz('u1', 'quiz-1', {
      respostas: [{ questaoId: 'q1', alternativaId: 'alt1' }],
    } as any)).resolves.toMatchObject({
      tentativaId: 'tentativa-1', quizId: 'quiz-1', totalAcertos: 1, concluido: true,
    });
    expect(prismaMock.tentativaQuiz.create).toHaveBeenCalled();
  });
});
