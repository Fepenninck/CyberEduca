import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class CriarQuestaoProvaDto {
  @IsString({ message: 'O enunciado deve ser um texto valido.' })
  @MinLength(5, { message: 'O enunciado deve ter pelo menos 5 caracteres.' })
  enunciado: string;

  @IsInt({ message: 'A ordem deve ser um numero inteiro.' })
  @Min(1, { message: 'A ordem deve ser maior ou igual a 1.' })
  ordem: number;
}
