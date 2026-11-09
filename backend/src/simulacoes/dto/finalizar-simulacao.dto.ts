import { Type } from 'class-transformer';
import { IsArray, IsInt, Min, ValidateNested } from 'class-validator';
import { RespostaSimulacaoDto } from '../../admin/dto/responder-simulacao.dto';

export class FinalizarSimulacaoDto {
  @IsInt()
  @Min(0)
  acertos: number;

  @IsInt()
  @Min(0)
  totalQuestoes: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RespostaSimulacaoDto)
  respostas: RespostaSimulacaoDto[];
}
