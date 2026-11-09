import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CriarAlternativaSimulacaoDto {
  @IsString()
  texto: string;

  @IsBoolean()
  isCorreta: boolean;
}

export class CriarQuestaoSimulacaoDto {
  @IsString()
  enunciado: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriarAlternativaSimulacaoDto)
  alternativas?: CriarAlternativaSimulacaoDto[];
}

export class CriarSimulacaoDto {
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
