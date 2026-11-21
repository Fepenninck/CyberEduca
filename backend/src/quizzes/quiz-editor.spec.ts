import { describe, expect, it, jest } from '@jest/globals';
import { ConflictException } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { PrismaService } from '../prisma.service';

function preparar() {
  const fn = () => jest.fn<(...args: any[]) => Promise<any>>();
  const tx = {
    quiz: {
      findUnique: fn().mockResolvedValue({ id: 'quiz', status: 'RASCUNHO' }),
      update: fn().mockResolvedValue({ status: 'RASCUNHO' }),
      delete: fn(),
    },
    questaoQuiz: {
      count: fn().mockResolvedValue(0),
      create: fn().mockResolvedValue({ id: 'q' }),
      findFirst: fn().mockResolvedValue({ id: 'q' }),
      update: fn(),
      deleteMany: fn(),
      delete: fn(),
    },
    alternativaQuiz: { deleteMany: fn() },
    tentativaQuiz: { count: fn().mockResolvedValue(0) },
  };
  const prisma = {
    $transaction: jest
      .fn<(...args: any[]) => Promise<any>>()
      .mockImplementation((callback: (client: unknown) => Promise<unknown>) =>
        callback(tx),
      ),
  };
  return {
    tx,
    service: new QuizzesService(prisma as unknown as PrismaService),
  };
}
describe('Editor administrativo de quizzes', () => {
  const questao = {
    enunciado: 'Questão',
    explicacao: 'Explicação',
    ordem: 1,
    alternativas: [
      { texto: 'A', correta: true, ordem: 1 },
      { texto: 'B', correta: false, ordem: 2 },
    ],
  };
  it('cria a questão e suas alternativas na mesma transação', async () => {
    const { tx, service } = preparar();
    await expect(
      service.criarQuestaoCompleta('quiz', questao),
    ).resolves.toEqual({ id: 'q' });
    expect(
      tx.questaoQuiz.create.mock.calls[0][0].data.alternativas.create,
    ).toEqual(questao.alternativas);
  });
  it('recusa gabarito inválido antes de gravar', async () => {
    const { tx, service } = preparar();
    await expect(
      service.criarQuestaoCompleta('quiz', {
        ...questao,
        alternativas: questao.alternativas.map((item) => ({
          ...item,
          correta: true,
        })),
      }),
    ).rejects.toThrow('exatamente uma correta');
    expect(tx.questaoQuiz.create).not.toHaveBeenCalled();
  });
  it('protege quizzes com resultados contra exclusão e retorno a rascunho', async () => {
    const { tx, service } = preparar();
    tx.tentativaQuiz.count.mockResolvedValue(2);
    await expect(service.excluirQuiz('quiz')).rejects.toBeInstanceOf(
      ConflictException,
    );
    await expect(service.voltarRascunho('quiz')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(tx.quiz.delete).not.toHaveBeenCalled();
  });
  it('exclui dependências de um quiz sem tentativas na mesma transação', async () => {
    const { tx, service } = preparar();
    await service.excluirQuiz('quiz');
    expect(tx.alternativaQuiz.deleteMany).toHaveBeenCalledWith({
      where: { questao: { quizId: 'quiz' } },
    });
    expect(tx.questaoQuiz.deleteMany).toHaveBeenCalledWith({
      where: { quizId: 'quiz' },
    });
    expect(tx.quiz.delete).toHaveBeenCalledWith({ where: { id: 'quiz' } });
  });
  it('impede edição de questão pertencente a outro quiz', async () => {
    const { tx, service } = preparar();
    tx.questaoQuiz.findFirst.mockResolvedValue(null);
    await expect(
      service.editarQuestaoCompleta('quiz', 'outra', questao),
    ).rejects.toThrow('não encontrada');
    expect(tx.alternativaQuiz.deleteMany).not.toHaveBeenCalled();
  });
});
