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
}
