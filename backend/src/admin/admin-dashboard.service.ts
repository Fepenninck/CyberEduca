import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async buscarResumoDashboard() {
    const [
      totalUsuarios,
      totalTrilhas,
      totalAulas,
      totalQuizzes,
      totalSimulacoes,
      totalProvas,
    ] = await Promise.all([
      this.prisma.usuario.count(),
      this.prisma.trilha.count(),
      this.prisma.aula.count(),
      this.prisma.quiz.count(),
      this.prisma.cenarioPhishing.count(),
      this.prisma.prova.count(),
    ]);

    return {
      totalUsuarios,
      totalTrilhas,
      totalAulas,
      totalQuizzes,
      totalSimulacoes,
      totalProvas,
    };
  }
}
