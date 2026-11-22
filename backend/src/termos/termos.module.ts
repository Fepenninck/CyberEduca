import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from '../prisma.service';
import { TermosService } from './termos.service';
import { TermosAdminController } from './termos-admin.controller';
import { PrivacidadeService } from './privacidade.service';
import {
  PrivacidadeAdminController,
  PrivacidadeController,
} from './privacidade.controller';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [
    TermosAdminController,
    PrivacidadeAdminController,
    PrivacidadeController,
  ],
  providers: [TermosService, PrivacidadeService, PrismaService],
  exports: [TermosService],
})
export class TermosModule {}
