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
      findMany: jest.fn<(...args: any[]) => Promise<any[]>>(),
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
    prismaMock.progressoAula.findMany.mockResolvedValue([]);

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
      trilha: { nivel: 'BASICO', bloqueada: false, ordem: 1 },
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

  it('exige a prova anterior mesmo quando as aulas da trilha já foram concluídas', async () => {
    prismaMock.aula.count.mockResolvedValue(5);
    prismaMock.progressoAula.count.mockResolvedValue(5);
    const bloqueada = await service['estaBloqueada'](
      { id: 'trilha-antiga', nivel: 'INTERMEDIARIO', bloqueada: true, ordem: 2 },
      'usuario-1', [],
    );
    expect(bloqueada).toBe(true);
    expect(prismaMock.progressoAula.upsert).not.toHaveBeenCalled();
  });

  it('mantém o pré-requisito de prova para trilhas não concluídas ou vazias', async () => {
    prismaMock.aula.count.mockResolvedValue(5);
    prismaMock.progressoAula.count.mockResolvedValue(4);
    const trilha = { id: 'trilha-nova', nivel: 'INTERMEDIARIO', bloqueada: false, ordem: 2 };
    expect(await service['estaBloqueada'](trilha, 'usuario-1', [])).toBe(true);
    prismaMock.aula.count.mockResolvedValue(0);
    prismaMock.progressoAula.count.mockResolvedValue(0);
    expect(await service['estaBloqueada'](trilha, 'usuario-1', [])).toBe(true);
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
    prismaMock.progressoAula.findMany.mockResolvedValue([
      { aula: { trilhaId: 'trilha-1' } }, { aula: { trilhaId: 'trilha-1' } },
    ]);
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

    expect(prismaMock.progressoAula.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { usuarioId: 'usuario-1', concluida: true, aula: { trilhaId: { in: ['trilha-1'] } } },
    }));
    expect(prismaMock.aula.count).not.toHaveBeenCalled();
    expect(prismaMock.progressoAula.count).not.toHaveBeenCalled();
  });

  it('calcula pré-requisitos e progresso em lote sem consultar cada trilha separadamente', async () => {
    prismaMock.trilha.findMany.mockResolvedValue([1, 2, 3].map(ordem => ({
      id: `trilha-${ordem}`, titulo: `Trilha ${ordem}`, descricao: 'Conteúdo', nivel: 'BASICO', ordem,
      bloqueada: ordem > 1, _count: { aulas: 2 },
    })));
    prismaMock.progressoAula.findMany.mockResolvedValue([
      { aula: { trilhaId: 'trilha-1' } }, { aula: { trilhaId: 'trilha-1' } },
      { aula: { trilhaId: 'trilha-2' } },
    ]);
    const result = await service.listarTrilhas('usuario-1');
    expect(result.map(item => ({ percentual: item.percentual, bloqueada: item.bloqueada }))).toEqual([
      { percentual: 100, bloqueada: false }, { percentual: 50, bloqueada: false }, { percentual: 0, bloqueada: true },
    ]);
    expect(prismaMock.trilha.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.progressoAula.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.aula.count).not.toHaveBeenCalled();
    expect(prismaMock.progressoAula.count).not.toHaveBeenCalled();
  });
});
