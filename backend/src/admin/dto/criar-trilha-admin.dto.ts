import { NivelTrilha } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CriarTrilhaAdminDto {
  @IsString()
  titulo: string;

  @IsString()
  descricao: string;

  @IsInt()
  @Min(1)
  ordem: number;

  @IsEnum(NivelTrilha)
  nivel: NivelTrilha;

  @IsOptional()
  @IsBoolean()
  bloqueada?: boolean;
}
