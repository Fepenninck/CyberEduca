import { Module } from '@nestjs/common';
import { AprendizagemModule } from './aprendizagem/aprendizagem.module';

@Module({
  imports: [AprendizagemModule],
})
export class AppModule {}