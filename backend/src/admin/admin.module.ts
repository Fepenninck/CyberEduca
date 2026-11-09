import { Module } from '@nestjs/common';
import { DesempenhoModule } from '../desempenho/desempenho.module';
import { AprendizagemService } from '../aprendizagem/aprendizagem.service';
import { AuthModule } from '../auth/auth.module';
import { AuditoriaModule } from '../auditoria.module';
import { ProvasModule } from '../provas/provas.module';
import { SimulacoesModule } from '../simulacoes/simulacoes.module';
import { PrismaService } from '../prisma.service';
import { AdminController } from './admin.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { AdminUsuariosService } from './admin-usuarios.service';

@Module({
  imports: [
    AuthModule,
    AuditoriaModule,
    ProvasModule,
    SimulacoesModule,
    DesempenhoModule,
  ],
  controllers: [AdminController],
  providers: [
    AdminGuard,
    AdminService,
    AdminDashboardService,
    AdminUsuariosService,
    AprendizagemService,
    PrismaService,
  ],
})
export class AdminModule {}
