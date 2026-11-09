import { AvaliacoesModule } from './avaliacoes/avaliacoes.module';
import { DesempenhoModule } from './desempenho/desempenho.module';
import { Module } from '@nestjs/common';
import { AprendizagemModule } from './aprendizagem/aprendizagem.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AuthModule } from './auth/auth.module';
import { AuditoriaModule } from './auditoria.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { PhishingModule } from './phishing/phishing.module';
import { ConsultaSegurancaModule } from './consulta-seguranca/consulta-seguranca.module';
import { AdminModule } from './admin/admin.module';
import { ProvasModule } from './provas/provas.module';
import { SimulacoesModule } from './simulacoes/simulacoes.module';

@Module({
  imports: [
    AvaliacoesModule,
    DesempenhoModule,
    AuditoriaModule,
    AprendizagemModule,
    UsuariosModule,
    AuthModule,
    QuizzesModule,
    PhishingModule,
    ConsultaSegurancaModule,
    AdminModule,
    ProvasModule,
    SimulacoesModule,
  ],
})
export class AppModule {}
