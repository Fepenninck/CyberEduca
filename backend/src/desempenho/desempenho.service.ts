import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DesempenhoService {
  constructor(private readonly prisma: PrismaService) {}

  async buscarDesempenhoUsuario(usuarioId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, nome: true },
    });
    if (!usuario) throw new NotFoundException('Usuário não encontrado.');
    const [aulas, quizzes, simulacoes, provas] = await Promise.all([
      this.buscarProgressoAulas(usuarioId),
      this.buscarHistoricoQuizzes(usuarioId),
      this.buscarHistoricoSimulacoes(usuarioId),
      this.buscarHistoricoProvas(usuarioId),
    ]);
    return {
      usuarioId,
      nome: usuario.nome,
      totalAulasConcluidas: aulas.length,
      totalQuizzesConcluidos: quizzes.length,
      totalSimulacoesConcluidas: simulacoes.length,
      totalProvasRealizadas: provas.length,
      mediaNotas: this.calcularMediaNotas(provas),
      aulas,
      quizzes,
      simulacoes,
      provas,
    };
  }

  buscarMeuDesempenho(usuarioId: string) {
    return this.buscarDesempenhoUsuario(usuarioId);
  }
  calcularMediaNotas(provas: Array<{ nota: number }>) {
    return provas.length
      ? Math.round(
          (provas.reduce((total, prova) => total + prova.nota, 0) /
            provas.length) *
            100,
        ) / 100
      : 0;
  }
  buscarProgressoAulas(usuarioId: string) {
    return this.prisma.progressoAula.findMany({
      where: { usuarioId, concluida: true },
      orderBy: { dataConclusao: 'desc' },
      include: { aula: { select: { id: true, titulo: true, trilhaId: true } } },
    });
  }
  buscarHistoricoQuizzes(usuarioId: string) {
    return this.prisma.tentativaQuiz.findMany({
      where: { usuarioId },
      orderBy: { concluidoEm: 'desc' },
      include: { quiz: { select: { id: true, titulo: true, aulaId: true } } },
    });
  }
  buscarHistoricoSimulacoes(usuarioId: string) {
    return this.prisma.tentativaPhishing.findMany({
      where: { usuarioId },
      orderBy: { concluidoEm: 'desc' },
      include: {
        cenario: { select: { id: true, titulo: true, aulaId: true } },
      },
    });
  }
  buscarHistoricoProvas(usuarioId: string) {
    return this.prisma.tentativaProva.findMany({
      where: { usuarioId, concluidoEm: { not: null } },
      orderBy: { concluidoEm: 'desc' },
      include: { prova: { select: { id: true, titulo: true } } },
    });
  }
}
