import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CriarAlternativaProvaDto {
  @IsString({ message: 'O texto deve ser valido.' })
  @MinLength(1, { message: 'Informe o texto da alternativa.' })
  texto: string;

  @IsOptional()
  @IsBoolean({ message: 'O campo correta deve ser verdadeiro ou falso.' })
  correta?: boolean;

  @IsInt({ message: 'A ordem deve ser um numero inteiro.' })
  @Min(1, { message: 'A ordem deve ser maior ou igual a 1.' })
  ordem: number;
}
