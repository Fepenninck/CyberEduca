import {
  Equals,
  IsBoolean,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class AceitarTermosDto {
  @IsBoolean()
  @Equals(true, { message: 'Aceite os Termos de Uso para continuar.' })
  acceptedTerms: boolean;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  termsVersion: string;
}
