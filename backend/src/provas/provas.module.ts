import { Module } from '@nestjs/common';
import { ProvasController } from './provas.controller';
import { ProvasService } from './provas.service';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';
import { AvaliacoesModule } from '../avaliacoes/avaliacoes.module';

@Module({
  imports: [AuthModule, AvaliacoesModule],
  controllers: [ProvasController],
  providers: [ProvasService, PrismaService],
  exports: [ProvasService],
})
export class ProvasModule {}
