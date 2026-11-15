import { IsEmail, IsString } from 'class-validator';
import { NormalizarEmail } from '../../common/normalizar-email';

export class LoginDto {
  @NormalizarEmail()
  @IsEmail({}, { message: 'O e-mail fornecido é inválido.' })
  email: string;

  @IsString()
  password: string;
}