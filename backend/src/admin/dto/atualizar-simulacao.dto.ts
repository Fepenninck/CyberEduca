import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class AtualizarAlternativaSimulacaoDto {
  @IsString()
  texto: string;

  @IsBoolean()
  isCorreta: boolean;
}

class AtualizarQuestaoSimulacaoDto {
  @IsString()
  enunciado: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AtualizarAlternativaSimulacaoDto)
  alternativas?: AtualizarAlternativaSimulacaoDto[];
}

export class AtualizarSimulacaoDto {
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
