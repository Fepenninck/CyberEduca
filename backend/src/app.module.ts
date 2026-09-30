import { Module } from '@nestjs/common';
import { AprendizagemModule } from './aprendizagem/aprendizagem.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AuthModule } from './auth/auth.module';
import { AuditoriaModule } from './auditoria.module';

@Module({
  imports: [AuditoriaModule, AprendizagemModule, UsuariosModule, AuthModule],
})
export class AppModule {}
