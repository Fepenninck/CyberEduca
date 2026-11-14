import { IsIn } from 'class-validator';

export class AtualizarStatusProvaDto {
  @IsIn(['RASCUNHO', 'PUBLICADO', 'ARQUIVADO'], {
    message: 'O status deve ser RASCUNHO, PUBLICADO ou ARQUIVADO.',
  })
  status: 'RASCUNHO' | 'PUBLICADO' | 'ARQUIVADO';
}
