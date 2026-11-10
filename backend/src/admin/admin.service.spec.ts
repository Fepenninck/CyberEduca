import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PrismaService } from '../prisma.service';
import { AdminService } from './admin.service';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminUsuariosService } from './admin-usuarios.service';

describe('AdminService', () => {
  const prismaMock = {
    resultadoProva: { findMany: jest.fn<(...args: any[]) => Promise<any>>() },
    resultadoSimulacao: { findMany: jest.fn<(...args: any[]) => Promise<any>>() },
  };
  let service: AdminService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new AdminService(
      {} as AdminDashboardService,
      {} as AdminUsuariosService,
      prismaMock as unknown as PrismaService,
    );
  });

  it('lista resultados de provas com dados do aluno e da prova', async () => {
    const resultados = [{ id: 'resultado-1', usuario: { nome: 'Ana' }, prova: { titulo: 'Prova 1' } }];
    prismaMock.resultadoProva.findMany.mockResolvedValue(resultados);

    await expect(service.listarResultadosProvas()).resolves.toEqual(resultados);
    expect(prismaMock.resultadoProva.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { criadoEm: 'desc' },
        include: expect.objectContaining({ usuario: expect.any(Object), prova: expect.any(Object) }),
      }),
    );
  });

  it('lista resultados de simulações com dados do aluno e da simulação', async () => {
    const resultados = [{ id: 'resultado-1', usuario: { nome: 'Ana' }, simulacao: { titulo: 'Treino' } }];
    prismaMock.resultadoSimulacao.findMany.mockResolvedValue(resultados);

    await expect(service.listarResultadosSimulacoes()).resolves.toEqual(resultados);
    expect(prismaMock.resultadoSimulacao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { criadoEm: 'desc' },
        include: expect.objectContaining({ usuario: expect.any(Object), simulacao: expect.any(Object) }),
      }),
    );
  });
});
