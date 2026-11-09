import { IsBoolean, IsString } from 'class-validator';

export class CriarAlternativaProvaDto {
  @IsString()
  texto: string;

  @IsBoolean()
  isCorreta: boolean;
}
