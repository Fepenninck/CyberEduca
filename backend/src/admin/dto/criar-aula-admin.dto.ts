import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CriarAulaAdminDto {
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsNotEmpty() @MaxLength(160)
  titulo: string;

  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsNotEmpty() @MaxLength(500000)
  conteudo: string;

  @IsInt()
  @Min(1)
  ordem: number;

  @IsString()
  @IsNotEmpty()
  trilhaId: string;
}

export class AtualizarAulaAdminDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  titulo?: string;

  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(500000)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  conteudo?: string;

  @IsOptional() @IsInt() @Min(1)
  ordem?: number;

  @IsOptional() @IsString() @IsNotEmpty()
  trilhaId?: string;
}
