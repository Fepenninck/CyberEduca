import { mascararEmailUsuario } from '../common/privacidade';
import { Injectable } from '@nestjs/common';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminUsuariosService } from './admin-usuarios.service';
import { PrismaService } from '../prisma.service';
import { isCertificationExam, passed, PASS_MARK } from '../certificacoes/certification-progress';

@Injectable()
export class AdminService {
  constructor(
    private readonly dashboardService: AdminDashboardService,
    private readonly usuariosService: AdminUsuariosService,
    private readonly prisma: PrismaService,
  ) {}

  async listarResultadosProvas() {
    const [legados, tentativas] = await Promise.all([this.prisma.resultadoProva.findMany({
      orderBy: { criadoEm: 'desc' },
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
        prova: { select: { id: true, titulo: true } },
      },
    }), this.prisma.tentativaProva.findMany({
      where: { concluidoEm: { not: null } },
      select: { id: true, usuarioId: true, provaId: true, totalAcertos: true, totalQuestoes: true, concluidoEm: true,
        usuario: { select: { id: true, nome: true, email: true } }, prova: { select: { id: true, titulo: true } } },
    })]);
    // ResultadoProva também recebe o resumo da tentativa: não contar a mesma prova duas vezes.
    const comTentativas = new Set(tentativas.map(item => `${item.usuarioId}:${item.provaId}`));
    const resultados = [
      ...legados.filter(item => !comTentativas.has(`${item.usuarioId}:${item.provaId}`)),
      ...tentativas.map(item => ({ id: item.id, usuarioId: item.usuarioId, provaId: item.provaId,
        acertos: item.totalAcertos, totalQuestoes: item.totalQuestoes, criadoEm: item.concluidoEm!, usuario: item.usuario, prova: item.prova })),
    ];
    return resultados.map(item => {
      const certificacao = isCertificationExam(item.provaId);
      const valida = item.totalQuestoes > 0 && item.acertos >= 0 && item.acertos <= item.totalQuestoes;
      return { ...item, usuario: mascararEmailUsuario(item.usuario), aprovado: certificacao && valida ? passed({ totalAcertos: item.acertos, totalQuestoes: item.totalQuestoes }) : null,
        notaMinima: certificacao ? PASS_MARK : null };
    }).sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime() || a.id.localeCompare(b.id));
  }

  async listarResultadosSimulacoes() {
    const resultados = await this.prisma.resultadoSimulacao.findMany({
      orderBy: { criadoEm: 'desc' },
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
        simulacao: { select: { id: true, titulo: true } },
      },
    });
    return resultados.map(item => ({ ...item, usuario: mascararEmailUsuario(item.usuario) }));
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
