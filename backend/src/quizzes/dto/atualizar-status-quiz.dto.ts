import { IsIn } from 'class-validator';

export class AtualizarStatusQuizDto {
  @IsIn(['RASCUNHO', 'PUBLICADO', 'ARQUIVADO'])
  status!: 'RASCUNHO' | 'PUBLICADO' | 'ARQUIVADO';
}
