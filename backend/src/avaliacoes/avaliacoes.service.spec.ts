import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AvaliacoesService } from './avaliacoes.service';
import { CorrecaoProvaService } from './correcao-prova.service';

describe('AvaliacoesService', () => {
  const prismaMock = {
    questaoProva: { findMany: jest.fn<(...args: any[]) => Promise<any>>() },
    tentativaProva: {
      findFirst: jest.fn<(...args: any[]) => Promise<any>>(),
      create: jest.fn<(...args: any[]) => Promise<any>>(),
      findUnique: jest.fn<(...args: any[]) => Promise<any>>(),
      findMany: jest.fn<(...args: any[]) => Promise<any>>(),
    },
    respostaProva: { createMany: jest.fn<(...args: any[]) => Promise<any>>() },
    $transaction: jest.fn<(...args: any[]) => Promise<any>>(),
  };
  let service: AvaliacoesService;

  beforeEach(() => {
    jest.resetAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback: any) => callback({
      $executeRaw: async () => 1,
      resultadoProva: { findUnique: async () => null, upsert: async () => ({}) },
      tentativaProva: prismaMock.tentativaProva,
      respostaProva: prismaMock.respostaProva,
    }));
    service = new AvaliacoesService(
      prismaMock as unknown as PrismaService,
      new CorrecaoProvaService(),
    );
  });

  it('salva uma tentativa corrigida dentro de transação', async () => {
    prismaMock.questaoProva.findMany.mockResolvedValue([{
      id: 'q1', alternativas: [{ id: 'a1', isCorreta: true }, { id: 'a2', isCorreta: false }],
    }]);
    prismaMock.tentativaProva.create.mockResolvedValue({ id: 'tentativa-1' });
    prismaMock.respostaProva.createMany.mockResolvedValue({ count: 1 });

    await expect(service.salvarTentativaProva('u1', 'p1', [{ questaoId: 'q1', alternativaId: 'a1' }]))
      .resolves.toMatchObject({ tentativaId: 'tentativa-1', provaId: 'p1', nota: 10, concluido: true });
    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(prismaMock.respostaProva.createMany).toHaveBeenCalled();
  });

  it('recusa salvar tentativa quando a prova não possui questões', async () => {
    prismaMock.questaoProva.findMany.mockResolvedValue([]);

    await expect(service.salvarTentativaProva('u1', 'p1', [])).rejects.toThrow(NotFoundException);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('retorna o resultado de tentativa pertencente ao aluno', async () => {
    prismaMock.tentativaProva.findUnique.mockResolvedValue({
      id: 't1', usuarioId: 'u1', provaId: 'p1', prova: { titulo: 'Fundamentos' },
      nota: 8, totalQuestoes: 5, totalAcertos: 4, concluidoEm: new Date('2026-01-01'), respostas: [],
    });

    await expect(service.buscarResultadoProva('t1', 'u1')).resolves.toMatchObject({
      tentativaId: 't1', provaTitulo: 'Fundamentos', nota: 8, concluido: true,
    });
  });

  it('lista as tentativas do usuário com o título da prova', async () => {
    prismaMock.tentativaProva.findMany.mockResolvedValue([{
      id: 't1', provaId: 'p1', prova: { titulo: 'Fundamentos' }, nota: 8,
      totalQuestoes: 5, totalAcertos: 4, concluidoEm: null,
    }]);

    await expect(service.listarMinhasTentativas('u1')).resolves.toEqual([{
      tentativaId: 't1', provaId: 'p1', provaTitulo: 'Fundamentos', nota: 8,
      totalQuestoes: 5, totalAcertos: 4, concluidoEm: null,
    }]);
  });
});

describe('AvaliacoesService', () => {
  it('corrige no servidor, salva a tentativa e retorna explicação após o envio', async () => {
    const create = jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue({ id: 'tentativa' });
    const createMany = jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue({ count: 1 });
    const prisma = {
      questaoProva: { findMany: async () => [{
        id: 'questao', enunciado: 'Como proteger a conta?', explicacao: 'Use uma senha única.',
        alternativas: [
          { id: 'certa', texto: 'Senha única', isCorreta: true },
          { id: 'errada', texto: 'Reutilizar senhas', isCorreta: false },
        ],
      }] },
      $transaction: async (callback: (tx: unknown) => Promise<unknown>) => callback({
        $executeRaw: async () => 1,
        resultadoProva: { findUnique: async () => null, upsert: async () => ({}) },
        tentativaProva: { create, findFirst: async () => null }, respostaProva: { createMany },
      }),
    };
    const service = new AvaliacoesService(prisma as unknown as PrismaService, new CorrecaoProvaService());
    const resultado = await service.salvarTentativaProva('usuario', 'prova', [{ questaoId: 'questao', alternativaId: 'errada' }]);
    expect(resultado.nota).toBe(0);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ usuarioId: 'usuario', provaId: 'prova', totalAcertos: 0 }) }));
    expect(createMany).toHaveBeenCalled();
    expect(resultado.feedback).toEqual([{ questaoId: 'questao', enunciado: 'Como proteger a conta?', explicacao: 'Use uma senha única.', correta: false, respostaCorreta: 'Senha única' }]);
  });

  it('bloqueia novo envio quando a conta já concluiu a prova', async () => {
    const create = jest.fn();
    const prisma = {
      questaoProva: { findMany: async () => [{ id: 'q', enunciado: 'Pergunta', explicacao: '', alternativas: [{ id: 'a', texto: 'A', isCorreta: true }] }] },
      $transaction: async (callback: (tx: unknown) => Promise<unknown>) => callback({
        $executeRaw: async () => 1,
        resultadoProva: { findUnique: async () => null },
        tentativaProva: { findFirst: async () => ({ id: 'salva' }), create },
      }),
    };
    const service = new AvaliacoesService(prisma as unknown as PrismaService, new CorrecaoProvaService());
    await expect(service.salvarTentativaProva('usuario', 'prova', [{ questaoId: 'q', alternativaId: 'a' }])).rejects.toThrow(ConflictException);
    expect(create).not.toHaveBeenCalled();
  });
});
