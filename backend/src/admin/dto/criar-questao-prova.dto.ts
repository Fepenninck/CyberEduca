import { TipoQuestao } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CriarQuestaoProvaDto {
  @IsString()
  enunciado: string;

  @IsOptional()
  @IsEnum(TipoQuestao)
  tipo?: TipoQuestao;
}
