import { IsIn } from 'class-validator';

export class AtualizarStatusQuizDto {
  @IsIn(['PUBLICADO', 'ARQUIVADO'])
  status!: 'PUBLICADO' | 'ARQUIVADO';
}