import { Transform } from 'class-transformer';
import { TipoCenarioPhishing } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class AtualizarCenarioDto {
  @ValidateIf((_obj, value) => value !== undefined)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  titulo?: string;

  @ValidateIf((_obj, value) => value !== undefined)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  descricao?: string;

  @ValidateIf((_obj, value) => value !== undefined)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  conteudoMensagem?: string;

  @ValidateIf((_obj, value) => value !== undefined)
  @IsEnum(TipoCenarioPhishing)
  tipo?: TipoCenarioPhishing;

  @ValidateIf((_obj, value) => value !== undefined)
  @IsBoolean()
  ehPhishing?: boolean;

  @ValidateIf((_obj, value) => value !== undefined)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  explicacao?: string;

  @ValidateIf((_obj, value) => value !== undefined)
  @IsUUID()
  aulaId?: string;
}