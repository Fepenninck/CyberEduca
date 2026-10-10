import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'O nome deve ter pelo menos 2 caracteres.' })
  @MaxLength(100, { message: 'O nome deve ter no máximo 100 caracteres.' })
  nome?: string;

  @IsOptional()
  @IsEmail({}, { message: 'O e-mail fornecido é inválido.' })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500_000, { message: 'A foto de perfil é muito grande.' })
  @Matches(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/, {
    message: 'A foto de perfil possui um formato inválido.',
  })
  foto?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres.' })
  @Matches(/[A-Z]/, { message: 'A senha deve conter pelo menos uma letra maiúscula.' })
  @Matches(/[a-z]/, { message: 'A senha deve conter pelo menos uma letra minúscula.' })
  @Matches(/\d/, { message: 'A senha deve conter pelo menos um número.' })
  @Matches(/[^A-Za-z0-9\s]/, { message: 'A senha deve conter pelo menos um caractere especial.' })
  senha?: string;
}
