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

class AtualizarAlternativaSimulacaoDto {
  @IsString()
  texto: string;

  @IsBoolean()
  isCorreta: boolean;
}

class AtualizarQuestaoSimulacaoDto {
  @IsString()
  enunciado: string;

  @IsOptional() @IsString() @MaxLength(10000)
  contexto?: string;

  @IsOptional() @IsString() @MaxLength(4000)
  explicacao?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AtualizarAlternativaSimulacaoDto)
  alternativas?: AtualizarAlternativaSimulacaoDto[];
}

export class AtualizarSimulacaoDto {
  @IsOptional() @IsEnum(NivelTrilha)
  nivel?: NivelTrilha;

  @IsOptional() @IsInt() @Min(1) @Max(60)
  duracaoMinutos?: number;
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  categoriaId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AtualizarQuestaoSimulacaoDto)
  questoes?: AtualizarQuestaoSimulacaoDto[];
}
