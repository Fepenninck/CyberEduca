import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SimulacoesService } from './simulacoes.service';

describe('SimulacoesService', () => {
  const prismaMock = {
    simulacao: {
      findMany: jest.fn<(...args: any[]) => Promise<any>>(),
      create: jest.fn<(...args: any[]) => Promise<any>>(),
    },
  };
  let service: SimulacoesService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new SimulacoesService(prismaMock as unknown as PrismaService);
  });

  it('lista simulações administrativas com categoria e conteúdo', async () => {
    const simulacoes = [{ id: 'sim-1', titulo: 'E-mail seguro' }];
    prismaMock.simulacao.findMany.mockResolvedValue(simulacoes);

    await expect(service.listarAdmin()).resolves.toEqual(simulacoes);
    expect(prismaMock.simulacao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { criadoEm: 'desc' },
        include: expect.objectContaining({ categoria: true, questoes: expect.any(Object) }),
      }),
    );
  });

  it('cria simulação e questões com alternativas em cascata', async () => {
    const criada = { id: 'sim-1', titulo: 'E-mail seguro' };
    prismaMock.simulacao.create.mockResolvedValue(criada);

    await expect(service.criar({
      titulo: 'E-mail seguro',
      descricao: 'Identifique sinais de phishing',
      categoriaId: 'categoria-1',
      questoes: [{
        enunciado: 'O remetente é confiável?',
        alternativas: [
          { texto: 'Sim', isCorreta: false },
          { texto: 'Não', isCorreta: true },
        ],
      }],
    } as any)).resolves.toEqual(criada);

    expect(prismaMock.simulacao.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          categoriaId: 'categoria-1',
          questoes: expect.objectContaining({ create: expect.any(Array) }),
        }),
      }),
    );
  });

  it('rejeita questões sem exatamente uma alternativa correta antes do Prisma', async () => {
    await expect(service.criar({
      titulo: 'E-mail seguro',
      descricao: 'Treino',
      categoriaId: 'categoria-1',
      questoes: [{
        enunciado: 'O remetente é confiável?',
        alternativas: [{ texto: 'Talvez', isCorreta: false }],
      }],
    } as any)).rejects.toThrow(BadRequestException);
    expect(prismaMock.simulacao.create).not.toHaveBeenCalled();
  });
});
