import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma.service';
import { SimulacoesController } from './simulacoes.controller';
import { SimulacoesService } from './simulacoes.service';

@Module({
  imports: [AuthModule],
  controllers: [SimulacoesController],
  providers: [SimulacoesService, PrismaService],
  exports: [SimulacoesService],
})
export class SimulacoesModule {}
