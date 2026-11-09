import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma.service';
import { ConsultaSegurancaController } from './consulta-seguranca.controller';
import { ConsultaSegurancaService } from './consulta-seguranca.service';
import { VirusTotalService } from './virustotal.service';

@Module({
  imports: [AuthModule],
  controllers: [ConsultaSegurancaController],
  providers: [
    PrismaService,
    JwtAuthGuard,
    ConsultaSegurancaService,
    VirusTotalService,
  ],
})
export class ConsultaSegurancaModule {}