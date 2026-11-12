import { beforeEach, describe, expect, it, jest } from '@jest/globals';

class ErroConhecidoPrisma extends Error {
  constructor(public code: string) {
    super(code);
  }
}

jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: class PrismaClient {},
  Prisma: {
    TransactionIsolationLevel: { Serializable: 'Serializable' },
    PrismaClientKnownRequestError: ErroConhecidoPrisma,
  },
  TipoCenarioPhishing: { EMAIL: 'EMAIL' },
}));

const { PhishingService } = await import('./phishing.service');
type PrismaService = import('../prisma.service').PrismaService;
type PhishingServiceType = import('./phishing.service').PhishingService;

const fn = () => jest.fn<(...args: any[]) => Promise<any>>();

describe('PhishingService', () => {
  const prismaMock = {
    cenarioPhishing: { findMany: fn(), findFirst: fn(), findUnique: fn(), create: fn(), update: fn() },
    aula: { findUnique: fn() },
    tentativaPhishing: { create: fn(), findFirst: fn() },
    $transaction: fn(),
  };
  let service: PhishingServiceType;

  const rascunho = {
    id: 'c1', status: 'RASCUNHO', titulo: 'Título', descricao: 'Descrição',
    conteudoMensagem: 'Mensagem', explicacao: 'Explicação', aulaId: 'a1',
  };

  beforeEach(() => {
    jest.resetAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback: any) => callback(prismaMock));
    service = new PhishingService(prismaMock as unknown as PrismaService);
  });

  it('lista cenários administrativos e publicados', async () => {
    prismaMock.cenarioPhishing.findMany.mockResolvedValue([{ id: 'c1' }]);
    await expect(service.listarCenariosAdmin()).resolves.toEqual([{ id: 'c1' }]);
    await expect(service.listarCenarios('a1', 'u1')).resolves.toEqual([{ id: 'c1' }]);
    await expect(service.listarCenarios()).resolves.toEqual([{ id: 'c1' }]);
    expect(prismaMock.cenarioPhishing.findMany).toHaveBeenCalledTimes(3);
  });

  it('cria cenário depois de confirmar a aula relacionada', async () => {
    prismaMock.aula.findUnique.mockResolvedValue({ id: 'a1' });
    prismaMock.cenarioPhishing.create.mockResolvedValue({ id: 'c1', titulo: 'E-mail suspeito' });

    await expect(service.criarCenario({
      titulo: 'E-mail suspeito', descricao: 'Analise o remetente', conteudoMensagem: 'Mensagem de teste',
      tipo: 'EMAIL', ehPhishing: true, explicacao: 'Domínio divergente', aulaId: 'a1',
    } as any)).resolves.toEqual({ id: 'c1', titulo: 'E-mail suspeito' });
  });

  it('recusa criar cenário para aula inexistente', async () => {
    prismaMock.aula.findUnique.mockResolvedValue(null);
    await expect(service.criarCenario({ aulaId: 'x' } as any)).rejects.toThrow('Aula não encontrada.');
  });

  it('atualiza um rascunho e valida a nova aula', async () => {
    prismaMock.cenarioPhishing.findUnique.mockResolvedValue(rascunho);
    prismaMock.aula.findUnique.mockResolvedValue({ id: 'a2' });
    prismaMock.cenarioPhishing.update.mockResolvedValue({ id: 'c1', titulo: 'Novo' });

    await expect(service.atualizarCenario('c1', { titulo: 'Novo', aulaId: 'a2' } as any)).resolves.toEqual({ id: 'c1', titulo: 'Novo' });
    expect(prismaMock.aula.findUnique).toHaveBeenCalled();
  });

  it('recusa atualização vazia, de cenário inexistente ou já publicado', async () => {
    prismaMock.cenarioPhishing.findUnique.mockResolvedValueOnce(rascunho);
    await expect(service.atualizarCenario('c1', {} as any)).rejects.toThrow('Informe pelo menos um campo');

    prismaMock.cenarioPhishing.findUnique.mockResolvedValueOnce(null);
    await expect(service.atualizarCenario('c1', { titulo: 'X' } as any)).rejects.toThrow('Cenário não encontrado.');

    prismaMock.cenarioPhishing.findUnique.mockResolvedValueOnce({ ...rascunho, status: 'PUBLICADO' });
    await expect(service.atualizarCenario('c1', { titulo: 'X' } as any)).rejects.toThrow('Somente cenários em rascunho');
  });

  it('publica um cenário completo vinculado a uma aula existente', async () => {
    prismaMock.cenarioPhishing.findUnique.mockResolvedValue(rascunho);
    prismaMock.aula.findUnique.mockResolvedValue({ id: 'a1' });
    prismaMock.cenarioPhishing.update.mockResolvedValue({ id: 'c1', status: 'PUBLICADO' });

    await expect(service.publicarCenario('c1')).resolves.toEqual({ id: 'c1', status: 'PUBLICADO' });
  });

  it('não publica cenário com campos em branco', async () => {
    prismaMock.cenarioPhishing.findUnique.mockResolvedValue({ ...rascunho, explicacao: '   ' });
    await expect(service.publicarCenario('c1')).rejects.toThrow('Preencha título, descrição, mensagem e explicação');
  });

  it('arquiva um cenário existente e recusa um inexistente', async () => {
    prismaMock.cenarioPhishing.findUnique.mockResolvedValueOnce({ id: 'c1' });
    prismaMock.cenarioPhishing.update.mockResolvedValue({ id: 'c1', status: 'ARQUIVADO' });
    await expect(service.arquivarCenario('c1')).resolves.toEqual({ id: 'c1', status: 'ARQUIVADO' });

    prismaMock.cenarioPhishing.findUnique.mockResolvedValueOnce(null);
    await expect(service.arquivarCenario('c9')).rejects.toThrow('Cenário não encontrado.');
  });

  it('busca o cenário publicado junto com o resultado do aluno', async () => {
    prismaMock.cenarioPhishing.findFirst.mockResolvedValue({ id: 'c1', titulo: 'Título' });
    prismaMock.tentativaPhishing.findFirst.mockResolvedValue({
      id: 't1', acertou: true, respostaEhPhishing: true, cenario: { explicacao: 'Remetente falso.' },
    });

    await expect(service.buscarCenario('c1', 'u1')).resolves.toMatchObject({
      id: 'c1', resultado: { tentativaId: 't1', acertou: true, explicacao: 'Remetente falso.' },
    });
  });

  it('retorna resultado nulo sem usuário ou sem tentativa e erro para cenário inexistente', async () => {
    await expect(service.resultadoDoAluno('c1')).resolves.toBeNull();
    prismaMock.tentativaPhishing.findFirst.mockResolvedValue(null);
    await expect(service.resultadoDoAluno('c1', 'u1')).resolves.toBeNull();

    prismaMock.cenarioPhishing.findFirst.mockResolvedValue(null);
    await expect(service.buscarCenario('c9', 'u1')).rejects.toThrow('Cenário não encontrado.');
  });

  it('registra a resposta do aluno e retorna feedback explicativo', async () => {
    prismaMock.tentativaPhishing.findFirst.mockResolvedValue(null);
    prismaMock.cenarioPhishing.findFirst.mockResolvedValue({
      id: 'c1', ehPhishing: true, explicacao: 'O endereço do remetente é falso.',
    });
    prismaMock.tentativaPhishing.create.mockResolvedValue({ id: 'tentativa-1' });

    await expect(service.responderCenario('u1', 'c1', { respostaEhPhishing: true } as any)).resolves.toEqual({
      tentativaId: 'tentativa-1', cenarioId: 'c1', acertou: true, concluido: true,
      progressoAtualizado: false, explicacao: 'O endereço do remetente é falso.',
    });
  });

  it('impede responder duas vezes ou responder cenário não publicado', async () => {
    prismaMock.tentativaPhishing.findFirst.mockResolvedValueOnce({ id: 't1' });
    await expect(service.responderCenario('u1', 'c1', { respostaEhPhishing: true } as any)).rejects.toThrow('Atividade já concluída');

    prismaMock.tentativaPhishing.findFirst.mockResolvedValueOnce(null);
    prismaMock.cenarioPhishing.findFirst.mockResolvedValueOnce(null);
    await expect(service.responderCenario('u1', 'c9', { respostaEhPhishing: false } as any)).rejects.toThrow('Cenário não encontrado.');
  });

  it('repete a transação em conflito e traduz erros do banco', async () => {
    prismaMock.cenarioPhishing.findUnique.mockResolvedValue({ id: 'c1' });
    prismaMock.cenarioPhishing.update.mockResolvedValue({ id: 'c1', status: 'ARQUIVADO' });
    prismaMock.$transaction
      .mockRejectedValueOnce(new ErroConhecidoPrisma('P2034'))
      .mockImplementationOnce(async (callback: any) => callback(prismaMock));
    await expect(service.arquivarCenario('c1')).resolves.toEqual({ id: 'c1', status: 'ARQUIVADO' });

    prismaMock.$transaction.mockRejectedValue(new ErroConhecidoPrisma('P2034'));
    await expect(service.arquivarCenario('c1')).rejects.toThrow('Outra operação alterou estes dados');

    prismaMock.$transaction.mockRejectedValue(new ErroConhecidoPrisma('P2003'));
    await expect(service.arquivarCenario('c1')).rejects.toThrow('Um dos registros relacionados');

    prismaMock.$transaction.mockRejectedValue(new Error('falha'));
    await expect(service.arquivarCenario('c1')).rejects.toThrow('falha');
  });
});
