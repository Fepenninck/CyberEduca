import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma.service';
import { CorrecaoProvaService } from '../avaliacoes/correcao-prova.service';
import { CertificacoesService } from './certificacoes.service';
import { CertificacoesController } from './certificacoes.controller';
@Module({ imports: [AuthModule], providers: [PrismaService, CorrecaoProvaService, CertificacoesService], controllers: [CertificacoesController] })
export class CertificacoesModule {}
