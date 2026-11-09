import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma.service';
import { DesempenhoService } from './desempenho.service';
import {
  DesempenhoController,
  AdminDesempenhoController,
} from './desempenho.controller';

@Module({
  imports: [AuthModule],
  controllers: [DesempenhoController, AdminDesempenhoController],
  providers: [PrismaService, DesempenhoService],
  exports: [DesempenhoService],
})
export class DesempenhoModule {}
