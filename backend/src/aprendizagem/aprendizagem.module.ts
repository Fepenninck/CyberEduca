import { Module } from '@nestjs/common';
import { AprendizagemService } from './aprendizagem.service';
import {
  TrilhasController,
  AulasController,
  ProgressoController,
} from './aprendizagem.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [TrilhasController, AulasController, ProgressoController],
  providers: [AprendizagemService, PrismaService],
})
export class AprendizagemModule {}
