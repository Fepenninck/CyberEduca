import { Module } from '@nestjs/common';
import { AprendizagemModule } from './aprendizagem/aprendizagem.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AuthModule } from './auth/auth.module';
import { AuditoriaModule } from './auditoria.module';
import { AvaliacoesModule } from './avaliacoes/avaliacoes.module';
import { ProvasModule } from './provas/provas.module';

@Module({
  imports: [
    AuditoriaModule,
    AprendizagemModule,
    UsuariosModule,
    AuthModule,
    AvaliacoesModule,
    ProvasModule,
  ],
})
export class AppModule {}