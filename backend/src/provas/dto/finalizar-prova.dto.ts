import { Type } from 'class-transformer';
import { IsArray, IsInt, Min, ValidateNested } from 'class-validator';
import { RespostaQuestaoDto } from './responder-prova.dto';

export class FinalizarProvaDto {
  @IsInt()
  @Min(0)
  acertos: number;

  @IsInt()
  @Min(0)
  totalQuestoes: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RespostaQuestaoDto)
  respostas: RespostaQuestaoDto[];
}
