import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CriarProvaDto {
  @IsString({ message: 'O titulo deve ser um texto valido.' })
  @MinLength(3, { message: 'O titulo deve ter pelo menos 3 caracteres.' })
  titulo: string;

  @IsOptional()
  @IsString({ message: 'A descricao deve ser um texto valido.' })
  descricao?: string;

  @IsUUID('4', { message: 'Informe uma trilha valida.' })
  trilhaId: string;
}
