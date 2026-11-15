import { IsEmail } from 'class-validator';
import { NormalizarEmail } from '../../common/normalizar-email';

export class EsqueciSenhaDto {
  @NormalizarEmail()
  @IsEmail({}, { message: 'O e-mail fornecido é inválido.' })
  email: string;
}
