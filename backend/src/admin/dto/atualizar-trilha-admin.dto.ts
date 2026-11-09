import { NivelTrilha } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AtualizarTrilhaAdminDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  ordem?: number;

  @IsOptional()
  @IsEnum(NivelTrilha)
  nivel?: NivelTrilha;

  @IsOptional()
  @IsBoolean()
  bloqueada?: boolean;
}
