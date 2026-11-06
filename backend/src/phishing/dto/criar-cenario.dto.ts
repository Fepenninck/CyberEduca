import { Transform } from 'class-transformer';
import { TipoCenarioPhishing } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CriarCenarioDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  titulo!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  descricao!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  conteudoMensagem!: string;

  @IsEnum(TipoCenarioPhishing)
  tipo!: TipoCenarioPhishing;

  @IsBoolean()
  ehPhishing!: boolean;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  explicacao!: string;

  @IsUUID()
  aulaId!: string;
}