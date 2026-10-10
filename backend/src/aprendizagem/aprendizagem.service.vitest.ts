import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AprendizagemService } from './aprendizagem.service';
import { PrismaService } from '../prisma.service';
import { NivelTrilha } from '@prisma/client';

describe('AprendizagemService', () => {
  let service: AprendizagemService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AprendizagemService,
        {
          provide: PrismaService,
          useValue: {
            trilha: {
              findUnique: vi.fn(),
              findMany: vi.fn(),
              create: vi.fn(),
              update: vi.fn(),
            },
            aula: {
              findUnique: vi.fn(),
              findFirst: vi.fn(),
              count: vi.fn(),
              create: vi.fn(),
              update: vi.fn(),
            },
            progressoAula: {
              findMany: vi.fn(),
              findUnique: vi.fn(),
              upsert: vi.fn(),
              count: vi.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AprendizagemService>(AprendizagemService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('detalharTrilha', () => {
    // TESTE 1: CAMINHO FELIZ
    it('deve retornar detalhes da trilha quando ela existe e está desbloqueada', async () => {
      const trilhaId = 'trilha-123';
      const trilhaExistente = {
        id: trilhaId,
        titulo: 'Introdução à Segurança',
        descricao: 'Conceitos básicos',
        nivel: NivelTrilha.BASICO,
        bloqueada: false,
        ordem: 1,
        aulas: [
          { id: 'aula-1', titulo: 'Aula 1', ordem: 1, conteudo: '', trilhaId },
          { id: 'aula-2', titulo: 'Aula 2', ordem: 2, conteudo: '', trilhaId },
        ],
      };

      vi.spyOn(prisma.trilha, 'findUnique').mockResolvedValue(trilhaExistente as any);
      vi.spyOn(prisma.progressoAula, 'findMany').mockResolvedValue([
        {
          id: 'progresso-1',
          usuarioId: '11111111-1111-1111-1111-111111111111',
          aulaId: 'aula-1',
          concluida: true,
          dataConclusao: new Date(),
        },
        {
          id: 'progresso-2',
          usuarioId: '11111111-1111-1111-1111-111111111111',
          aulaId: 'aula-2',
          concluida: true,
          dataConclusao: new Date(),
        },
      ] as any);
      vi.spyOn(prisma.aula, 'count').mockResolvedValue(2);
      vi.spyOn(prisma.progressoAula, 'count').mockResolvedValue(2);
      vi.spyOn(prisma.trilha, 'findMany').mockResolvedValue([]);

      const resultado = await service.detalharTrilha(trilhaId);

      expect(resultado).toBeDefined();
      expect(resultado.id).toBe(trilhaId);
      expect(resultado.titulo).toBe('Introdução à Segurança');
      expect(resultado.aulas).toHaveLength(2);
    });

    // TESTE 2: VIOLAÇÃO DE REGRA - Trilha bloqueada
    it('deve lançar ForbiddenException quando a trilha está bloqueada', async () => {
      const trilhaId = 'trilha-bloqueada';
      const trilhaBloqueada = {
        id: trilhaId,
        titulo: 'Segurança Avançada',
        descricao: 'Conceitos avançados',
        nivel: NivelTrilha.AVANCADO,
        bloqueada: true,
        ordem: 2,
        aulas: [],
      };

      const trilhaAnterior = { id: 'trilha-1', ordem: 1, bloqueada: false, titulo: '', descricao: '', nivel: NivelTrilha.BASICO };

      vi.spyOn(prisma.trilha, 'findUnique').mockResolvedValue(trilhaBloqueada as any);
      vi.spyOn(prisma.trilha, 'findMany').mockResolvedValue([trilhaAnterior] as any);
      vi.spyOn(prisma.aula, 'count')
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(0);
      vi.spyOn(prisma.progressoAula, 'count').mockResolvedValueOnce(5);

      await expect(service.detalharTrilha(trilhaId)).rejects.toThrow(ForbiddenException);
    });

    // TESTE 3: CASO-LIMITE - Trilha não encontrada
    it('deve lançar NotFoundException quando a trilha não existe', async () => {
      const trilhaId = 'trilha-inexistente';

      vi.spyOn(prisma.trilha, 'findUnique').mockResolvedValue(null);

      await expect(service.detalharTrilha(trilhaId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('calcularPercentual - Teste Parametrizado', () => {
    it.each([
      [0, 0, 0],
      [1, 2, 50],
      [2, 2, 100],
      [5, 10, 50],
      [10, 10, 100],
    ])(
      'deve calcular %i aulas concluídas de %i total = %i%%',
      async (concluidas: number, total: number, percentualEsperado: number) => {
        const trilhaId = 'trilha-teste';

        vi.spyOn(prisma.aula, 'count').mockResolvedValue(total);
        vi.spyOn(prisma.progressoAula, 'count').mockResolvedValue(concluidas);

        const resultado = await service['calcularPercentual'](trilhaId);

        expect(resultado).toBe(percentualEsperado);
      },
    );
  });

  describe('concluirAula - Teste de Integração com Erro', () => {
    it('deve lançar NotFoundException ao tentar concluir aula que não existe', async () => {
      const aulaIdInexistente = 'aula-inexistente';

      vi.spyOn(prisma.aula, 'findUnique').mockResolvedValue(null);

      await expect(service.concluirAula(aulaIdInexistente)).rejects.toThrow(NotFoundException);
      expect(prisma.progressoAula.upsert).not.toHaveBeenCalled();
    });
  });
});