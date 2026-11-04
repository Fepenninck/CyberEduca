import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsUUID, ValidateNested } from 'class-validator';

export class RespostaTentativaDto {
  @IsUUID('4', { message: 'Informe uma questao valida.' })
  questaoId: string;

  @IsUUID('4', { message: 'Informe uma alternativa valida.' })
  alternativaId: string;
}

export class EnviarTentativaProvaDto {
  @IsArray({ message: 'As respostas devem ser enviadas em uma lista.' })
  @ArrayMinSize(1, { message: 'Responda pelo menos uma questao.' })
  @ValidateNested({ each: true })
  @Type(() => RespostaTentativaDto)
  respostas: RespostaTentativaDto[];
}
