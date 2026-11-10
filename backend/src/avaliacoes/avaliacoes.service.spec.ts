import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AvaliacoesService } from './avaliacoes.service';
import { CorrecaoProvaService } from './correcao-prova.service';

describe('AvaliacoesService', () => {
  const prismaMock = {
    questaoProva: { findMany: jest.fn<(...args: any[]) => Promise<any>>() },
    tentativaProva: {
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
