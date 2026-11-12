import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { QuizzesService } from './quizzes.service';

const fn = () => jest.fn<(...args: any[]) => Promise<any>>();
const erroPrisma = (code: string) =>
  new Prisma.PrismaClientKnownRequestError(code, { code, clientVersion: 'teste' });

describe('QuizzesService', () => {
  const prismaMock = {
    quiz: { findMany: fn(), findFirst: fn(), findUnique: fn(), create: fn(), update: fn() },
    aula: { findUnique: fn() },
    questaoQuiz: { findMany: fn(), findFirst: fn(), count: jest.fn<(...args: any[]) => Promise<number>>(), create: fn() },
    alternativaQuiz: { create: fn() },
    tentativaQuiz: { create: fn(), findFirst: fn() },
    $transaction: fn(),
  };
  let service: QuizzesService;
  const rascunho = { id: 'quiz-1', status: 'RASCUNHO' };
  const quizPublicado = {
    id: 'quiz-1',
    questoes: [{
      id: 'q1', ordem: 1, explicacao: 'A autenticação protege a conta.',
      alternativas: [{ id: 'alt1', correta: true }, { id: 'alt2', correta: false }],
    }],
  };

  beforeEach(() => {
    jest.resetAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback: any) => callback(prismaMock));
    service = new QuizzesService(prismaMock as unknown as PrismaService);
  });

  it('lista quizzes administrativos e quizzes publicados', async () => {
    prismaMock.quiz.findMany.mockResolvedValue([{ id: 'quiz-1' }]);
    await expect(service.listarQuizzesAdmin()).resolves.toEqual([{ id: 'quiz-1' }]);
    await expect(service.listarQuizzes('aula-1', 'u1')).resolves.toEqual([{ id: 'quiz-1' }]);
    await expect(service.listarQuizzes()).resolves.toEqual([{ id: 'quiz-1' }]);
    expect(prismaMock.quiz.findMany).toHaveBeenCalledTimes(3);
  });

  it('cria um quiz após confirmar que a aula existe', async () => {
    prismaMock.aula.findUnique.mockResolvedValue({ id: 'aula-1' });
    prismaMock.quiz.create.mockResolvedValue({ id: 'quiz-1', titulo: 'Boas práticas' });
    await expect(service.criarQuiz({ titulo: 'Boas práticas', descricao: 'Conceitos', aulaId: 'aula-1' } as any))
      .resolves.toEqual({ id: 'quiz-1', titulo: 'Boas práticas' });
  });

  it('recusa criar quiz para aula inexistente', async () => {
    prismaMock.aula.findUnique.mockResolvedValue(null);
    await expect(service.criarQuiz({ aulaId: 'x' } as any)).rejects.toThrow('Aula não encontrada.');
  });

  it('atualiza rascunho e valida campos e estado', async () => {
    prismaMock.quiz.findUnique.mockResolvedValue(rascunho);
    prismaMock.aula.findUnique.mockResolvedValue({ id: 'aula-2' });
    prismaMock.quiz.update.mockResolvedValue({ id: 'quiz-1', titulo: 'Novo' });
    await expect(service.atualizarQuiz('quiz-1', { titulo: 'Novo', aulaId: 'aula-2' } as any)).resolves.toEqual({ id: 'quiz-1', titulo: 'Novo' });

    await expect(service.atualizarQuiz('quiz-1', {} as any)).rejects.toThrow('Informe pelo menos um campo');

    prismaMock.quiz.findUnique.mockResolvedValueOnce(null);
    await expect(service.atualizarQuiz('quiz-9', { titulo: 'X' } as any)).rejects.toThrow('Quiz não encontrado.');

    prismaMock.quiz.findUnique.mockResolvedValueOnce({ ...rascunho, status: 'PUBLICADO' });
    await expect(service.atualizarQuiz('quiz-1', { titulo: 'X' } as any)).rejects.toThrow('Somente quizzes em rascunho');
  });

  it('cria questão respeitando o limite de 100', async () => {
    prismaMock.quiz.findUnique.mockResolvedValue(rascunho);
    prismaMock.questaoQuiz.count.mockResolvedValueOnce(3);
    prismaMock.questaoQuiz.create.mockResolvedValue({ id: 'q4' });
    await expect(service.criarQuestao('quiz-1', { enunciado: 'E', explicacao: 'X', ordem: 4 } as any)).resolves.toEqual({ id: 'q4' });

    prismaMock.questaoQuiz.count.mockResolvedValueOnce(100);
    await expect(service.criarQuestao('quiz-1', { enunciado: 'E', ordem: 101 } as any)).rejects.toThrow('no máximo 100 questões');
  });

  it('cria alternativa apenas em questão do próprio quiz', async () => {
    prismaMock.quiz.findUnique.mockResolvedValue(rascunho);
    prismaMock.questaoQuiz.findFirst.mockResolvedValueOnce({ id: 'q1' });
    prismaMock.alternativaQuiz.create.mockResolvedValue({ id: 'alt1' });
    await expect(service.criarAlternativa('quiz-1', 'q1', { texto: 'A', correta: true, ordem: 1 } as any)).resolves.toEqual({ id: 'alt1' });

    prismaMock.questaoQuiz.findFirst.mockResolvedValueOnce(null);
    await expect(service.criarAlternativa('quiz-1', 'q9', { texto: 'A' } as any)).rejects.toThrow('Questão não encontrada neste quiz.');
  });

  it('publica quiz rascunho com questão e gabarito válidos', async () => {
    prismaMock.quiz.findUnique.mockResolvedValue(rascunho);
    prismaMock.questaoQuiz.findMany.mockResolvedValue([{ ordem: 1, alternativas: [{ correta: true }, { correta: false }] }]);
    prismaMock.quiz.update.mockResolvedValue({ id: 'quiz-1', status: 'PUBLICADO' });
    await expect(service.publicarQuiz('quiz-1')).resolves.toEqual({ id: 'quiz-1', status: 'PUBLICADO' });
  });

  it('não publica quiz sem questões, com poucas alternativas ou gabarito inválido', async () => {
    prismaMock.quiz.findUnique.mockResolvedValue(rascunho);
    prismaMock.questaoQuiz.findMany.mockResolvedValueOnce([]);
    await expect(service.publicarQuiz('quiz-1')).rejects.toThrow('Cadastre pelo menos uma questão');

    prismaMock.questaoQuiz.findMany.mockResolvedValueOnce([{ ordem: 1, alternativas: [{ correta: true }] }]);
    await expect(service.publicarQuiz('quiz-1')).rejects.toThrow('precisa de pelo menos duas alternativas');

    prismaMock.questaoQuiz.findMany.mockResolvedValueOnce([{ ordem: 2, alternativas: [{ correta: true }, { correta: true }] }]);
    await expect(service.publicarQuiz('quiz-1')).rejects.toThrow('exatamente uma alternativa correta');
  });

  it('arquiva quiz existente e recusa inexistente', async () => {
    prismaMock.quiz.findUnique.mockResolvedValueOnce({ id: 'quiz-1' });
    prismaMock.quiz.update.mockResolvedValue({ id: 'quiz-1', status: 'ARQUIVADO' });
    await expect(service.arquivarQuiz('quiz-1')).resolves.toEqual({ id: 'quiz-1', status: 'ARQUIVADO' });

    prismaMock.quiz.findUnique.mockResolvedValueOnce(null);
    await expect(service.arquivarQuiz('quiz-9')).rejects.toThrow('Quiz não encontrado.');
  });

  it('busca quiz publicado com o resultado salvo do aluno', async () => {
    prismaMock.quiz.findFirst.mockResolvedValue({ id: 'quiz-1', titulo: 'Quiz' });
    prismaMock.tentativaQuiz.findFirst.mockResolvedValue({
      id: 't1', totalQuestoes: 1, totalAcertos: 1,
      respostas: [{ questaoId: 'q1', alternativaId: 'alt1', acertou: true, questao: { explicacao: 'Exp', alternativas: [{ id: 'alt1', correta: true }] } }],
    });
    await expect(service.buscarQuiz('quiz-1', 'u1')).resolves.toMatchObject({
      id: 'quiz-1', resultado: { tentativaId: 't1', feedback: [{ alternativaCorretaId: 'alt1', acertou: true }] },
    });
  });

  it('retorna resultado nulo sem usuário ou tentativa e erro para quiz inexistente', async () => {
    await expect(service.resultadoDoAluno('quiz-1')).resolves.toBeNull();
    prismaMock.tentativaQuiz.findFirst.mockResolvedValue(null);
    await expect(service.resultadoDoAluno('quiz-1', 'u1')).resolves.toBeNull();
    prismaMock.quiz.findFirst.mockResolvedValue(null);
    await expect(service.buscarQuiz('quiz-9', 'u1')).rejects.toThrow('Quiz não encontrado.');
  });

  it('corrige respostas e registra tentativa do aluno', async () => {
    prismaMock.tentativaQuiz.findFirst.mockResolvedValue(null);
    prismaMock.quiz.findFirst.mockResolvedValue(quizPublicado);
    prismaMock.tentativaQuiz.create.mockResolvedValue({ id: 'tentativa-1', totalQuestoes: 1, totalAcertos: 1 });

    await expect(service.responderQuiz('u1', 'quiz-1', {
      respostas: [{ questaoId: 'q1', alternativaId: 'alt1' }],
    } as any)).resolves.toMatchObject({
      tentativaId: 'tentativa-1', quizId: 'quiz-1', totalAcertos: 1, concluido: true,
    });
  });

  it('valida as respostas antes de registrar a tentativa', async () => {
    const responder = (respostas: any[]) => service.responderQuiz('u1', 'quiz-1', { respostas } as any);

    prismaMock.tentativaQuiz.findFirst.mockResolvedValueOnce({ id: 't1' });
    await expect(responder([])).rejects.toThrow('Atividade já concluída');

    prismaMock.quiz.findFirst.mockResolvedValueOnce(null);
    await expect(responder([])).rejects.toThrow('Quiz não encontrado.');

    prismaMock.quiz.findFirst.mockResolvedValueOnce({ id: 'quiz-1', questoes: [] });
    await expect(responder([])).rejects.toThrow('não possui questões');

    prismaMock.quiz.findFirst.mockResolvedValueOnce(quizPublicado);
    await expect(responder([])).rejects.toThrow('Responda todas as questões');

    prismaMock.quiz.findFirst.mockResolvedValueOnce(quizPublicado);
    await expect(responder([{ questaoId: 'q1', alternativaId: 'outra' }])).rejects.toThrow('Selecione uma alternativa válida');

    prismaMock.quiz.findFirst.mockResolvedValueOnce({
      id: 'quiz-1', questoes: [{ id: 'q1', ordem: 1, alternativas: [{ id: 'alt1', correta: false }, { id: 'alt2', correta: false }] }],
    });
    await expect(responder([{ questaoId: 'q1', alternativaId: 'alt1' }])).rejects.toThrow('gabarito inválido');
    expect(prismaMock.tentativaQuiz.create).not.toHaveBeenCalled();
  });

  it('repete a transação em conflito e traduz erros do banco', async () => {
    prismaMock.quiz.findUnique.mockResolvedValue({ id: 'quiz-1' });
    prismaMock.quiz.update.mockResolvedValue({ id: 'quiz-1', status: 'ARQUIVADO' });
    prismaMock.$transaction
      .mockRejectedValueOnce(erroPrisma('P2034'))
      .mockImplementationOnce(async (callback: any) => callback(prismaMock));
    await expect(service.arquivarQuiz('quiz-1')).resolves.toEqual({ id: 'quiz-1', status: 'ARQUIVADO' });

    prismaMock.$transaction.mockRejectedValue(erroPrisma('P2034'));
    await expect(service.arquivarQuiz('quiz-1')).rejects.toThrow('Outra operação alterou estes dados');
    prismaMock.$transaction.mockRejectedValue(erroPrisma('P2002'));
    await expect(service.arquivarQuiz('quiz-1')).rejects.toThrow('Já existe um registro');
    prismaMock.$transaction.mockRejectedValue(erroPrisma('P2003'));
    await expect(service.arquivarQuiz('quiz-1')).rejects.toThrow('Um dos registros relacionados');
    prismaMock.$transaction.mockRejectedValue(new Error('falha'));
    await expect(service.arquivarQuiz('quiz-1')).rejects.toThrow('falha');
  });
});
