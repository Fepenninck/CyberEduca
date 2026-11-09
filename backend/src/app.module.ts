import { Module } from '@nestjs/common';
import { AprendizagemModule } from './aprendizagem/aprendizagem.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AuthModule } from './auth/auth.module';
import { AuditoriaModule } from './auditoria.module';
<<<<<<< HEAD
import { QuizzesModule } from './quizzes/quizzes.module';
import { PhishingModule } from './phishing/phishing.module';
import { ConsultaSegurancaModule } from './consulta-seguranca/consulta-seguranca.module';
=======
import { AdminModule } from './admin/admin.module';
import { ProvasModule } from './provas/provas.module';
import { SimulacoesModule } from './simulacoes/simulacoes.module';
>>>>>>> origin/feature/caio-admin

@Module({
  imports: [
    AuditoriaModule,
    AprendizagemModule,
    UsuariosModule,
    AuthModule,
<<<<<<< HEAD
    QuizzesModule,
    PhishingModule,
    ConsultaSegurancaModule,
=======
    AdminModule,
    ProvasModule,
    SimulacoesModule,
>>>>>>> origin/feature/caio-admin
  ],
})
export class AppModule {}