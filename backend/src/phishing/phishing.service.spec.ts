import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: class PrismaClient {},
  Prisma: {
    TransactionIsolationLevel: { Serializable: 'Serializable' },
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {},
  },
  TipoCenarioPhishing: { EMAIL: 'EMAIL' },
}));

const { PhishingService } = await import('./phishing.service');
type PrismaService = import('../prisma.service').PrismaService;
type PhishingServiceType = import('./phishing.service').PhishingService;

describe('PhishingService', () => {
  const prismaMock = {
    cenarioPhishing: {
      findMany: jest.fn<(...args: any[]) => Promise<any>>(),
      findFirst: jest.fn<(...args: any[]) => Promise<any>>(),
      findUnique: jest.fn<(...args: any[]) => Promise<any>>(),
      create: jest.fn<(...args: any[]) => Promise<any>>(),
      update: jest.fn<(...args: any[]) => Promise<any>>(),
    },
    aula: { findUnique: jest.fn<(...args: any[]) => Promise<any>>() },
    tentativaPhishing: { create: jest.fn<(...args: any[]) => Promise<any>>() },
    $transaction: jest.fn<(...args: any[]) => Promise<any>>(),
  };
  let service: PhishingServiceType;

  beforeEach(() => {
    jest.resetAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback: any) => callback(prismaMock));
    service = new PhishingService(prismaMock as unknown as PrismaService);
  });

  it('lista cenários administrativos e publicados', async () => {
    prismaMock.cenarioPhishing.findMany.mockResolvedValue([{ id: 'c1' }]);
    await expect(service.listarCenariosAdmin()).resolves.toEqual([{ id: 'c1' }]);
    await expect(service.listarCenarios('a1')).resolves.toEqual([{ id: 'c1' }]);
    expect(prismaMock.cenarioPhishing.findMany).toHaveBeenCalledTimes(2);
  });

  it('cria cenário depois de confirmar a aula relacionada', async () => {
    prismaMock.aula.findUnique.mockResolvedValue({ id: 'a1' });
    prismaMock.cenarioPhishing.create.mockResolvedValue({ id: 'c1', titulo: 'E-mail suspeito' });

    await expect(service.criarCenario({
      titulo: 'E-mail suspeito', descricao: 'Analise o remetente', conteudoMensagem: 'Mensagem de teste',
      tipo: 'EMAIL', ehPhishing: true, explicacao: 'Domínio divergente', aulaId: 'a1',
    } as any)).resolves.toEqual({ id: 'c1', titulo: 'E-mail suspeito' });
    expect(prismaMock.cenarioPhishing.create).toHaveBeenCalled();
  });

  it('publica um cenário completo vinculado a uma aula existente', async () => {
    prismaMock.cenarioPhishing.findUnique.mockResolvedValue({
      id: 'c1', status: 'RASCUNHO', titulo: 'Título', descricao: 'Descrição',
      conteudoMensagem: 'Mensagem', explicacao: 'Explicação', aulaId: 'a1',
    });
    prismaMock.aula.findUnique.mockResolvedValue({ id: 'a1' });
    prismaMock.cenarioPhishing.update.mockResolvedValue({ id: 'c1', status: 'PUBLICADO' });

    await expect(service.publicarCenario('c1')).resolves.toEqual({ id: 'c1', status: 'PUBLICADO' });
    expect(prismaMock.cenarioPhishing.update).toHaveBeenCalled();
  });

  it('registra a resposta do aluno e retorna feedback explicativo', async () => {
    prismaMock.cenarioPhishing.findFirst.mockResolvedValue({
      id: 'c1', ehPhishing: true, explicacao: 'O endereço do remetente é falso.',
    });
    prismaMock.tentativaPhishing.create.mockResolvedValue({ id: 'tentativa-1' });

    await expect(service.responderCenario('u1', 'c1', { respostaEhPhishing: true } as any)).resolves.toEqual({
      tentativaId: 'tentativa-1', cenarioId: 'c1', acertou: true, concluido: true,
      progressoAtualizado: false, explicacao: 'O endereço do remetente é falso.',
    });
    expect(prismaMock.tentativaPhishing.create).toHaveBeenCalled();
  });
});
