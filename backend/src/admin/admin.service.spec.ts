import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PrismaService } from '../prisma.service';
import { AdminService } from './admin.service';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminUsuariosService } from './admin-usuarios.service';
import { EXAM_IDS } from '../certificacoes/certification-progress';

describe('AdminService', () => {
  const prismaMock = {
    resultadoProva: { findMany: jest.fn<(...args: any[]) => Promise<any>>() },
    resultadoSimulacao: { findMany: jest.fn<(...args: any[]) => Promise<any>>() },
    tentativaProva: { findMany: jest.fn<(...args: any[]) => Promise<any>>() },
  };
  let service: AdminService;

  beforeEach(() => {
    jest.resetAllMocks();
    prismaMock.tentativaProva.findMany.mockResolvedValue([]);
    service = new AdminService(
      {} as AdminDashboardService,
      {} as AdminUsuariosService,
      prismaMock as unknown as PrismaService,
    );
  });

  it('lista resultados de provas com dados do aluno e da prova', async () => {
    const resultados = [{ id: 'resultado-1', provaId: 'p1', usuarioId: 'u1', criadoEm: new Date(), acertos: 1, totalQuestoes: 2, usuario: { nome: 'Ana' }, prova: { titulo: 'Prova 1' } }];
    prismaMock.resultadoProva.findMany.mockResolvedValue(resultados);

    await expect(service.listarResultadosProvas()).resolves.toEqual(resultados.map(item => ({ ...item, aprovado: null, notaMinima: null })));
    expect(prismaMock.resultadoProva.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { criadoEm: 'desc' },
        include: expect.objectContaining({ usuario: expect.any(Object), prova: expect.any(Object) }),
      }),
    );
  });
  it('inclui tentativas de certificação sem duplicar o resumo legado e aplica a regra real de 6/10', async () => {
    const usuario = { id: 'u1', nome: 'Ana', email: 'ana@example.invalid' };
    const prova = { id: EXAM_IDS.BASICO, titulo: 'Certificação' };
    prismaMock.resultadoProva.findMany.mockResolvedValue([{ id: 'legado', usuarioId: usuario.id, provaId: prova.id }]);
    prismaMock.tentativaProva.findMany.mockResolvedValue([
      { id: 'antes', usuarioId: usuario.id, provaId: prova.id, usuario, prova, totalAcertos: 5, totalQuestoes: 10, concluidoEm: new Date('2026-11-14T12:00:00Z') },
      { id: 'depois', usuarioId: usuario.id, provaId: prova.id, usuario, prova, totalAcertos: 6, totalQuestoes: 10, concluidoEm: new Date('2026-11-15T12:00:00Z') },
    ]);
    const resultados = await service.listarResultadosProvas();
    expect(resultados.map(item => item.id)).toEqual(['depois', 'antes']);
    expect(resultados.map(item => item.aprovado)).toEqual([true, false]);
    expect(resultados.every(item => item.notaMinima === 6)).toBe(true);
    expect(resultados.every(item => item.usuario.email === 'an***@example.invalid')).toBe(true);
    expect(prismaMock.tentativaProva.findMany).toHaveBeenCalledWith(expect.objectContaining({where: {concluidoEm: {not: null}}}));
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

  it('agrupa médias das avaliações e ordena da menor nota para a maior', async () => {
    prismaMock.resultadoProva.findMany.mockResolvedValue([
      { provaId: 'p1', acertos: 1, totalQuestoes: 4, prova: { titulo: 'Fundamentos' } },
      { provaId: 'p2', acertos: 4, totalQuestoes: 4, prova: { titulo: 'Redes' } },
      { provaId: 'p1', acertos: 3, totalQuestoes: 4, prova: { titulo: 'Fundamentos' } },
    ]);

    await expect(service.obterEstatisticasDificuldade()).resolves.toEqual([
      {
        provaId: 'p1',
        titulo: 'Fundamentos',
        mediaAcertos: 2,
        mediaNota: 50,
        totalResultados: 2,
      },
      {
        provaId: 'p2',
        titulo: 'Redes',
        mediaAcertos: 4,
        mediaNota: 100,
        totalResultados: 1,
      },
    ]);
  });
});
