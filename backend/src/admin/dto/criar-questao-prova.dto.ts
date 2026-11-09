import { TipoQuestao } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { IsInt, Min, IsOptional as Optional } from 'class-validator';

export class CriarQuestaoProvaDto {
  @Optional()
  @IsInt()
  @Min(0)
  ordem?: number;
  @IsString()
  enunciado: string;

  @IsOptional()
  @IsEnum(TipoQuestao)
  tipo?: TipoQuestao;
}
