import { StatusProva, TipoQuestao } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CriarAlternativaProvaDto {
  @IsString()
  texto: string;

  @IsBoolean()
  isCorreta: boolean;
}

export class CriarQuestaoProvaDto {
  @IsString()
  enunciado: string;

  @IsEnum(TipoQuestao)
  tipo: TipoQuestao;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriarAlternativaProvaDto)
  alternativas?: CriarAlternativaProvaDto[];
}

export class CriarProvaDto {
  @IsString()
  titulo: string;

  @IsString()
  descricao: string;

  @IsString()
  trilhaId: string;

  @IsOptional()
  @IsEnum(StatusProva)
  status?: StatusProva;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriarQuestaoProvaDto)
  questoes?: CriarQuestaoProvaDto[];
}
