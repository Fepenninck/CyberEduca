import { IsIn } from 'class-validator';

export class AtualizarStatusCenarioDto {
  @IsIn(['PUBLICADO', 'ARQUIVADO'])
  status!: 'PUBLICADO' | 'ARQUIVADO';
}