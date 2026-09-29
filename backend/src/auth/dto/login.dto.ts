import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'O e-mail fornecido é inválido.' })
  email: string;

  @IsString()
  password: string;
}