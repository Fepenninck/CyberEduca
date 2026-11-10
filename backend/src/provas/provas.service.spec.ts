import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { StatusProva, TipoQuestao } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { ProvasService } from './provas.service';

describe('ProvasService', () => {
  const prismaMock = {
    prova: {
      findMany: jest.fn<(...args: any[]) => Promise<any>>(),
      create: jest.fn<(...args: any[]) => Promise<any>>(),
    },
  };
  let service: ProvasService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ProvasService(prismaMock as unknown as PrismaService);
  });

  it('lista provas administrativas com questões e trilha', async () => {
    const provas = [{ id: 'prova-1', titulo: 'Segurança' }];
    prismaMock.prova.findMany.mockResolvedValue(provas);

    await expect(service.listarAdmin()).resolves.toEqual(provas);
    expect(prismaMock.prova.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { criadoEm: 'desc' },
        include: expect.objectContaining({ questoes: expect.any(Object) }),
      }),
    );
  });

  it('cria uma prova com as questões e alternativas aninhadas', async () => {
    const criada = { id: 'prova-1', titulo: 'Segurança' };
    prismaMock.prova.create.mockResolvedValue(criada);

    await expect(
      service.criar({
        titulo: 'Segurança',
        descricao: 'Avaliação básica',
        trilhaId: 'trilha-1',
        status: StatusProva.RASCUNHO,
        questoes: [{
          enunciado: 'Qual opção é segura?',
          tipo: TipoQuestao.MULTIPLA_ESCOLHA,
          alternativas: [
            { texto: 'Opção A', isCorreta: true },
            { texto: 'Opção B', isCorreta: false },
          ],
        }],
      }),
    ).resolves.toEqual(criada);

    expect(prismaMock.prova.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          titulo: 'Segurança',
          questoes: expect.objectContaining({ create: expect.any(Array) }),
        }),
      }),
    );
  });

  it('rejeita questão de múltipla escolha sem alternativa correta', async () => {
    await expect(service.criar({
      titulo: 'Segurança',
      descricao: 'Avaliação básica',
      trilhaId: 'trilha-1',
      questoes: [{
        enunciado: 'Qual opção é segura?',
        tipo: TipoQuestao.MULTIPLA_ESCOLHA,
        alternativas: [
          { texto: 'Opção A', isCorreta: false },
          { texto: 'Opção B', isCorreta: false },
        ],
      }],
    })).rejects.toThrow(BadRequestException);
    expect(prismaMock.prova.create).not.toHaveBeenCalled();
  });
});
