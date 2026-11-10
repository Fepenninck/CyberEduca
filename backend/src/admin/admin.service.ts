import { Injectable } from '@nestjs/common';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminUsuariosService } from './admin-usuarios.service';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly dashboardService: AdminDashboardService,
    private readonly usuariosService: AdminUsuariosService,
    private readonly prisma: PrismaService,
  ) {}

  listarResultadosProvas() {
    return this.prisma.resultadoProva.findMany({
      orderBy: { criadoEm: 'desc' },
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
        prova: { select: { id: true, titulo: true } },
      },
    });
  }

  listarResultadosSimulacoes() {
    return this.prisma.resultadoSimulacao.findMany({
      orderBy: { criadoEm: 'desc' },
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
        simulacao: { select: { id: true, titulo: true } },
      },
    });
  }

  async obterEstatisticasDificuldade() {
    const resultados = await this.prisma.resultadoProva.findMany({
      select: {
        provaId: true,
        acertos: true,
        totalQuestoes: true,
        prova: { select: { titulo: true } },
      },
    });

    const porProva = new Map<
      string,
      { provaId: string; titulo: string; somaAcertos: number; somaNotas: number; quantidade: number }
    >();

    for (const resultado of resultados) {
      const atual = porProva.get(resultado.provaId) ?? {
        provaId: resultado.provaId,
        titulo: resultado.prova.titulo,
        somaAcertos: 0,
        somaNotas: 0,
        quantidade: 0,
      };
      atual.somaAcertos += resultado.acertos;
      atual.somaNotas += resultado.totalQuestoes
        ? (resultado.acertos / resultado.totalQuestoes) * 100
        : 0;
      atual.quantidade += 1;
      porProva.set(resultado.provaId, atual);
    }

    return Array.from(porProva.values())
      .map(({ provaId, titulo, somaAcertos, somaNotas, quantidade }) => ({
        provaId,
        titulo,
        mediaAcertos: somaAcertos / quantidade,
        mediaNota: somaNotas / quantidade,
        totalResultados: quantidade,
      }))
      .sort((a, b) => a.mediaNota - b.mediaNota);
  }
}
