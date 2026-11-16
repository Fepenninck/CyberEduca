import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AuditoriaService } from './auditoria.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditoriaContexto } from './auditoria-contexto';
import { AuditoriaInterceptor } from './auditoria.interceptor';

@Global()
@Module({
  providers: [
    AuditoriaService,
    PrismaService,
    AuditoriaContexto,
    { provide: APP_INTERCEPTOR, useClass: AuditoriaInterceptor },
  ],
  exports: [AuditoriaService],
})
export class AuditoriaModule {}
