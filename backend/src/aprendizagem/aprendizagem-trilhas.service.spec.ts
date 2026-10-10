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

const usuarioId = 'usuario-1';
const trilhaId = 'trilha-1';

describe('AprendizagemService - trilhas', () => {
  let service: AprendizagemService;

  const prismaMock = {
    trilha: {
      findUnique: jest.fn<(...args: any[]) => Promise<any>>(),
      findMany: jest.fn<(...args: any[]) => Promise<any[]>>(),
    },
    aula: {
      count: jest.fn<(...args: any[]) => Promise<number>>(),
    },
    progressoAula: {
      findMany: jest.fn<(...args: any[]) => Promise<any[]>>(),
      count: jest.fn<(...args: any[]) => Promise<number>>(),
    },
  };

  const auditoriaMock = {
    registrar: jest.fn<(...args: any[]) => Promise<void>>(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AprendizagemService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditoriaService, useValue: auditoriaMock },
      ],
    }).compile();

    service = module.get(AprendizagemService);
  });

  // TESTE 1: CAMINHO FELIZ
  it('deve retornar os detalhes de uma trilha existente e liberada', async () => {
    prismaMock.trilha.findUnique.mockResolvedValue({
      id: trilhaId,
      titulo: 'Introdução à Segurança',
      descricao: 'Conceitos básicos',
      nivel: 'BASICO',
      bloqueada: false,
      ordem: 1,
      aulas: [
        { id: 'aula-1', titulo: 'Aula 1', ordem: 1 },
        { id: 'aula-2', titulo: 'Aula 2', ordem: 2 },
      ],
    });
    prismaMock.progressoAula.findMany.mockResolvedValue([
      { aulaId: 'aula-1' },
    ]);
    prismaMock.aula.count.mockResolvedValue(2);
    prismaMock.progressoAula.count.mockResolvedValue(1);

    const resultado = await service.detalharTrilha(trilhaId, usuarioId);

    expect(resultado).toEqual({
      id: trilhaId,
      titulo: 'Introdução à Segurança',
      descricao: 'Conceitos básicos',
      nivel: 'BASICO',
      bloqueada: false,
      percentual: 50,
      aulas: [
        { id: 'aula-1', titulo: 'Aula 1', ordem: 1, concluida: true },
        { id: 'aula-2', titulo: 'Aula 2', ordem: 2, concluida: false },
      ],
    });
  });

  // TESTE 2: VIOLAÇÃO DE REGRA
  it('deve lançar NotFoundException ao detalhar uma trilha inexistente', async () => {
    prismaMock.trilha.findUnique.mockResolvedValue(null);

    const operacao = service.detalharTrilha('trilha-inexistente', usuarioId);

    await expect(operacao).rejects.toThrow(NotFoundException);
    await expect(operacao).rejects.toThrow('Trilha nao encontrada');

    expect(prismaMock.progressoAula.findMany).not.toHaveBeenCalled();
  });

  // TESTE 3: CASO-LIMITE
  it('deve retornar 0% e nenhuma aula quando a trilha existe mas não tem aulas', async () => {
    prismaMock.trilha.findUnique.mockResolvedValue({
      id: trilhaId,
      titulo: 'Trilha vazia',
      descricao: 'Ainda sem conteúdo',
      nivel: 'BASICO',
      bloqueada: false,
      ordem: 1,
      aulas: [],
    });
    prismaMock.progressoAula.findMany.mockResolvedValue([]);
    prismaMock.aula.count.mockResolvedValue(0);

    const resultado = await service.detalharTrilha(trilhaId, usuarioId);

    expect(resultado.aulas).toEqual([]);
    expect(resultado.percentual).toBe(0);
    // Com 0 aulas o cálculo para antes de contar o progresso (evita divisão por zero)
    expect(prismaMock.progressoAula.count).not.toHaveBeenCalled();
  });

  // TESTE PARAMETRIZADO
  it.each([
    [0, 0, 0],
    [4, 0, 0],
    [4, 1, 25],
    [3, 1, 33],
    [3, 2, 67],
    [4, 4, 100],
  ])(
    'deve calcular o percentual com %i aulas e %i concluídas = %i%%',
    async (totalAulas: number, concluidas: number, esperado: number) => {
      prismaMock.aula.count.mockResolvedValue(totalAulas);
      prismaMock.progressoAula.count.mockResolvedValue(concluidas);

      const resultado = await (service as any).calcularPercentual(
        trilhaId,
        usuarioId,
      );

      expect(resultado).toBe(esperado);
    },
  );
});