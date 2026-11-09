import { Module } from '@nestjs/common';
import { AprendizagemModule } from './aprendizagem/aprendizagem.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AuthModule } from './auth/auth.module';
import { AuditoriaModule } from './auditoria.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { PhishingModule } from './phishing/phishing.module';
import { ConsultaSegurancaModule } from './consulta-seguranca/consulta-seguranca.module';

@Module({
  imports: [
    AuditoriaModule,
    AprendizagemModule,
    UsuariosModule,
    AuthModule,
    QuizzesModule,
    PhishingModule,
    ConsultaSegurancaModule,
  ],
})
export class AppModule {}