import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PrismaService } from '../prisma.service';
import { AdminDashboardService } from './admin-dashboard.service';

describe('AdminDashboardService', () => {
  const prismaMock = {
    $queryRaw: jest.fn<(...args: any[]) => Promise<any[]>>(),
    usuario: { count: jest.fn<(...args: any[]) => Promise<number>>() },
    trilha: { count: jest.fn<(...args: any[]) => Promise<number>>() },
    aula: { count: jest.fn<(...args: any[]) => Promise<number>>() },
    progressoAula: { findMany: jest.fn<(...args: any[]) => Promise<any[]>>() },
    logAuditoria: { findMany: jest.fn<(...args: any[]) => Promise<any[]>>() },
  };
  let service: AdminDashboardService;

  beforeEach(() => {
    jest.resetAllMocks();
    prismaMock.$queryRaw.mockResolvedValue([]);
    prismaMock.progressoAula.findMany.mockResolvedValue([]);
    prismaMock.logAuditoria.findMany.mockResolvedValue([]);
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
      progressoTrilhas: { iniciadas: 0, emAndamento: 0, concluidas: 0 },
      trilhasPopulares: [],
      taxaConclusao: null,
      aulasConcluidas: [], acessos: [], conclusoesTrilhas: [],
    });
    expect(prismaMock.usuario.count).toHaveBeenCalled();
    expect(prismaMock.trilha.count).toHaveBeenCalled();
    expect(prismaMock.aula.count).toHaveBeenCalled();
  });
  it('soma participações por aluno e trilha e remove trilhas sem atividade do ranking', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([
      { id: 'a', titulo: 'Contas', iniciadas: 3n, concluidas: 1n },
      { id: 'b', titulo: 'Redes', iniciadas: 2n, concluidas: 2n },
      { id: 'c', titulo: 'Sem atividade', iniciadas: 0n, concluidas: 0n },
    ]);
    const resumo = await service.buscarResumoDashboard();
    expect(resumo.progressoTrilhas).toEqual({ iniciadas: 5, emAndamento: 2, concluidas: 3 });
    expect(resumo.taxaConclusao).toBe(60);
    expect(resumo.trilhasPopulares).toEqual([
      { id: 'a', titulo: 'Contas', iniciadas: 3, concluidas: 1 },
      { id: 'b', titulo: 'Redes', iniciadas: 2, concluidas: 2 },
    ]);
    expect(() => JSON.stringify(resumo)).not.toThrow();
  });
  it('retorna somente os campos necessários para acessos e aulas, sem expor dados da auditoria', async () => {
    const data = new Date('2026-11-15T12:00:00Z');
    prismaMock.progressoAula.findMany.mockResolvedValue([{ id: 'aula', usuarioId: 'aluno', dataConclusao: data }]);
    prismaMock.logAuditoria.findMany.mockResolvedValue([{ id: 'login', atorId: 'aluno', criadoEm: data }]);
    const resumo = await service.buscarResumoDashboard();
    expect(resumo.aulasConcluidas).toEqual([{ id: 'aula', usuarioId: 'aluno', criadoEm: data }]);
    expect(resumo.acessos).toEqual([{ id: 'login', usuarioId: 'aluno', criadoEm: data }]);
    expect(prismaMock.logAuditoria.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ acao: 'LOGIN', sucesso: true, ator: { papel: { in: ['USUARIO', 'ALUNO'] } } }),
      select: { id: true, atorId: true, criadoEm: true },
    }));
  });
});
