import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ConfirmarTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'O link é inválido.' })
  @MaxLength(200)
  token: string;
}
