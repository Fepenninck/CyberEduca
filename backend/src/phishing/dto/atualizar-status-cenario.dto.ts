import { IsIn } from 'class-validator';

export class AtualizarStatusCenarioDto {
  @IsIn(['RASCUNHO', 'PUBLICADO', 'ARQUIVADO'])
  status!: 'RASCUNHO' | 'PUBLICADO' | 'ARQUIVADO';
}
