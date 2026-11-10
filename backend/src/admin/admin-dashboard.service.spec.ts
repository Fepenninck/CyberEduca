import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PrismaService } from '../prisma.service';
import { AdminDashboardService } from './admin-dashboard.service';

describe('AdminDashboardService', () => {
  const prismaMock = {
    usuario: { count: jest.fn<(...args: any[]) => Promise<number>>() },
    trilha: { count: jest.fn<(...args: any[]) => Promise<number>>() },
    aula: { count: jest.fn<(...args: any[]) => Promise<number>>() },
  };
  let service: AdminDashboardService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new AdminDashboardService(prismaMock as unknown as PrismaService);
  });

  it('retorna os totais globais de usuários, trilhas e aulas', async () => {
    prismaMock.usuario.count.mockResolvedValue(12);
    prismaMock.trilha.count.mockResolvedValue(4);
    prismaMock.aula.count.mockResolvedValue(18);

    await expect(service.buscarResumoDashboard()).resolves.toEqual({
      totalUsuarios: 12,
      totalTrilhas: 4,
      totalAulas: 18,
    });
    expect(prismaMock.usuario.count).toHaveBeenCalled();
    expect(prismaMock.trilha.count).toHaveBeenCalled();
    expect(prismaMock.aula.count).toHaveBeenCalled();
  });
});
