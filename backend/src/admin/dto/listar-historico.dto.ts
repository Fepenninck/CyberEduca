import { Type, Transform } from 'class-transformer';
import { AcaoAuditoria } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ListarHistoricoDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  busca?: string;

  @IsOptional()
  @IsUUID()
  usuarioId?: string;

  @IsOptional()
  @IsEnum(AcaoAuditoria)
  acao?: AcaoAuditoria;

  @IsOptional()
  @IsIn(['sucesso', 'falha'])
  resultado?: 'sucesso' | 'falha';

  @IsOptional()
  @IsDateString()
  inicio?: string;

  @IsOptional()
  @IsDateString()
  fim?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  pagina = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite = 25;
}
