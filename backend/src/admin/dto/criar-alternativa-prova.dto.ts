import { IsBoolean, IsString } from 'class-validator';
import { IsInt, Min, IsOptional as Optional } from 'class-validator';

export class CriarAlternativaProvaDto {
  @Optional()
  @IsInt()
  @Min(0)
  ordem?: number;
  @IsString()
  texto: string;

  @Optional()
  @IsBoolean()
  isCorreta?: boolean;

  @Optional()
  @IsBoolean()
  correta?: boolean;
}
