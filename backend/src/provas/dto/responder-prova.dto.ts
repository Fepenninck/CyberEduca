import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

export class RespostaQuestaoDto {
  @IsString()
  questaoId: string;

  @IsOptional()
  @IsString()
  alternativaId?: string;

  @IsOptional()
  @IsString()
  respostaTexto?: string;
}

export class ResponderProvaDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RespostaQuestaoDto)
  respostas: RespostaQuestaoDto[];
}
