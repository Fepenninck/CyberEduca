import { IsIn } from 'class-validator';

export class AtualizarStatusProvaDto {
  @IsIn(['RASCUNHO', 'PUBLICADA', 'ARQUIVADA'], {
    message: 'O status deve ser RASCUNHO, PUBLICADA ou ARQUIVADA.',
  })
  status: 'RASCUNHO' | 'PUBLICADA' | 'ARQUIVADA';
}
