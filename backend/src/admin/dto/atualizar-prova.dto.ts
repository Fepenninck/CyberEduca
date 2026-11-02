import { StatusProva } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class AtualizarProvaDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  trilhaId?: string;

  @IsOptional()
  @IsEnum(StatusProva)
  status?: StatusProva;
}
