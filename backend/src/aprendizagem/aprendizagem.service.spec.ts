import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { AuditoriaService } from '../auditoria.service';
import { PrismaService } from '../prisma.service';
import { AprendizagemService } from './aprendizagem.service';

describe('AprendizagemService - progresso', () => {
  let service: AprendizagemService;

  const prismaMock = {
    aula: {
      findUnique: jest.fn<
        (...args: any[]) => Promise<any>
      >(),

      count: jest.fn<
        (...args: any[]) => Promise<number>
      >(),
    },

    trilha: {
      findMany: jest.fn<
        (...args: any[]) => Promise<any[]>
      >(),
    },

    progressoAula: {
      upsert: jest.fn<
        (...args: any[]) => Promise<any>
      >(),

      count: jest.fn<
        (...args: any[]) => Promise<number>
      >(),
    },
  };

  const auditoriaMock = {
    registrar: jest.fn<
      (...args: any[]) => Promise<void>
    >(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          AprendizagemService,
          {
            provide: PrismaService,
            useValue: prismaMock,
          },
          {
            provide: AuditoriaService,
            useValue: auditoriaMock,
          },
        ],
      }).compile();

    service = module.get(AprendizagemService);
  });

  it('deve concluir uma aula válida', async () => {
    prismaMock.aula.findUnique.mockResolvedValue({
      id: 'aula-1',
      trilhaId: 'trilha-1',
    });

    prismaMock.progressoAula.upsert.mockResolvedValue({
      id: 'progresso-1',
    });

    prismaMock.aula.count.mockResolvedValue(1);

    prismaMock.progressoAula.count.mockResolvedValue(1);

    const resultado = await service.concluirAula(
      'aula-1',
      'usuario-1',
    );

    expect(resultado).toEqual({
      aulaId: 'aula-1',
      concluida: true,
      percentualTrilha: 100,
    });

    expect(
      prismaMock.progressoAula.upsert,
    ).toHaveBeenCalledWith({
      where: {
        usuarioId_aulaId: {
          usuarioId: 'usuario-1',
          aulaId: 'aula-1',
        },
      },

      update: {
        concluida: true,
        dataConclusao: expect.any(Date),
      },

      create: {
        usuarioId: 'usuario-1',
        aulaId: 'aula-1',
        concluida: true,
      },
    });

    expect(
      auditoriaMock.registrar,
    ).toHaveBeenCalled();
  });

  it('deve rejeitar uma aula inexistente', async () => {
    prismaMock.aula.findUnique.mockResolvedValue(null);

    const operacao = service.concluirAula(
      'aula-inexistente',
      'usuario-1',
    );

    await expect(operacao).rejects.toThrow(
      NotFoundException,
    );

    await expect(operacao).rejects.toThrow(
      'Aula nao encontrada',
    );

    expect(
      prismaMock.progressoAula.upsert,
    ).not.toHaveBeenCalled();

    expect(
      auditoriaMock.registrar,
    ).not.toHaveBeenCalled();
  });

  it('deve retornar 0% quando nenhuma aula foi concluída', async () => {
    prismaMock.trilha.findMany.mockResolvedValue([
      {
        id: 'trilha-1',
        titulo: 'Introdução',
        descricao: 'Conceitos básicos',
        nivel: 'BASICO',
        bloqueada: false,
        ordem: 1,

        _count: {
          aulas: 5,
        },
      },
    ]);

    prismaMock.aula.count.mockResolvedValue(5);

    prismaMock.progressoAula.count.mockResolvedValue(0);

    const resultado =
      await service.progressoGeral('usuario-1');

    expect(resultado[0]).toMatchObject({
      totalAulas: 5,
      percentual: 0,
    });
  });

  it('deve calcular 40% quando 2 de 5 aulas foram concluídas', async () => {
    prismaMock.trilha.findMany.mockResolvedValue([
      {
        id: 'trilha-1',
        titulo: 'Introdução',
        descricao: 'Conceitos básicos',
        nivel: 'BASICO',
        bloqueada: false,
        ordem: 1,

        _count: {
          aulas: 5,
        },
      },
    ]);

    prismaMock.aula.count.mockResolvedValue(5);

    prismaMock.progressoAula.count.mockResolvedValue(2);

    const resultado =
      await service.progressoGeral('usuario-1');

    expect(resultado[0].percentual).toBe(40);

    expect(
      prismaMock.progressoAula.count,
    ).toHaveBeenCalledWith({
      where: {
        usuarioId: 'usuario-1',
        concluida: true,

        aula: {
          trilhaId: 'trilha-1',
        },
      },
    });
  });
});