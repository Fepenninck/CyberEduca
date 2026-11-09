import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CriarAlternativaDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  texto!: string;

  @IsBoolean()
  correta!: boolean;

  @IsInt()
  @Min(1)
  ordem!: number;
}