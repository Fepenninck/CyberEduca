import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'O nome deve ser um texto válido.' })
  name: string;

  @IsEmail({}, { message: 'O e-mail fornecido é inválido.' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'A palavra-passe deve ter pelo menos 6 caracteres.' })
  password: string;
}