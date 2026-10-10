import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AuditoriaService } from './auditoria.service';

@Global()
@Module({
  providers: [AuditoriaService, PrismaService],
  exports: [AuditoriaService],
})
export class AuditoriaModule {}
