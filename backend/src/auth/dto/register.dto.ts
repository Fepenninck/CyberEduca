import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'O nome deve ser um texto válido.' })
  name: string;

  @IsEmail({}, { message: 'O e-mail fornecido é inválido.' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres.' })
  @Matches(/[A-Z]/, { message: 'A senha deve conter pelo menos uma letra maiúscula.' })
  @Matches(/[a-z]/, { message: 'A senha deve conter pelo menos uma letra minúscula.' })
  @Matches(/\d/, { message: 'A senha deve conter pelo menos um número.' })
  @Matches(/[^A-Za-z0-9\s]/, { message: 'A senha deve conter pelo menos um caractere especial.' })
  password: string;
}
