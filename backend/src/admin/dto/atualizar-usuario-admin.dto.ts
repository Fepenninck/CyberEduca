import { NormalizarNome } from '../../common/normalizar-nome';
import {
  IsEmail,
  IsOptional,
  ValidateIf,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { NormalizarEmail } from '../../common/normalizar-email';

export class AtualizarUsuarioAdminDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @NormalizarNome()
  nome?: string;

  @IsOptional()
  @NormalizarEmail()
  @IsEmail()
  email?: string;
}
