import { Module } from '@nestjs/common';
import { AprendizagemModule } from './aprendizagem/aprendizagem.module';
import { UsuariosModule } from './usuarios/usuarios.module';

@Module({
  imports: [AprendizagemModule,UsuariosModule],
})
export class AppModule {}