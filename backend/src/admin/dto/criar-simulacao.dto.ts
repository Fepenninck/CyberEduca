import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsEnum, IsInt, Min, Max, MaxLength,
  ValidateNested,
} from 'class-validator';
import { NivelTrilha } from '@prisma/client';

export class CriarAlternativaSimulacaoDto {
  @IsString()
  texto: string;

  @IsBoolean()
  isCorreta: boolean;
}

export class CriarQuestaoSimulacaoDto {
  @IsString()
  enunciado: string;

  @IsOptional() @IsString() @MaxLength(10000)
  contexto?: string;

  @IsOptional() @IsString() @MaxLength(4000)
  explicacao?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriarAlternativaSimulacaoDto)
  alternativas?: CriarAlternativaSimulacaoDto[];
}

export class CriarSimulacaoDto {
  @IsOptional() @IsEnum(NivelTrilha)
  nivel?: NivelTrilha;

  @IsOptional() @IsInt() @Min(1) @Max(60)
  duracaoMinutos?: number;
  @IsString()
  titulo: string;

  @IsString()
  descricao: string;

  @IsString()
  categoriaId: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriarQuestaoSimulacaoDto)
  questoes?: CriarQuestaoSimulacaoDto[];
}
