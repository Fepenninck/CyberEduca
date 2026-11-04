import { Module } from '@nestjs/common';
import { AvaliacoesController } from './avaliacoes.controller';
import { AvaliacoesService } from './avaliacoes.service';
import { CorrecaoProvaService } from './correcao-prova.service';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AvaliacoesController],
  providers: [AvaliacoesService, CorrecaoProvaService, PrismaService],
  exports: [AvaliacoesService],
})
export class AvaliacoesModule {}
