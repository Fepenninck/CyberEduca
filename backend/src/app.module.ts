import { Module } from '@nestjs/common';
import { AprendizagemModule } from './aprendizagem/aprendizagem.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AuthModule } from './auth/auth.module';
import { AuditoriaModule } from './auditoria.module';
import { AdminModule } from './admin/admin.module';
import { ProvasModule } from './provas/provas.module';
import { SimulacoesModule } from './simulacoes/simulacoes.module';

@Module({
  imports: [
    AuditoriaModule,
    AprendizagemModule,
    UsuariosModule,
    AuthModule,
    AdminModule,
    ProvasModule,
    SimulacoesModule,
  ],
})
export class AppModule {}
