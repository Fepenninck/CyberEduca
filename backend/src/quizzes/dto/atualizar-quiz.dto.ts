import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class AtualizarQuizDto {
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
  @IsUUID()
  aulaId?: string;
}