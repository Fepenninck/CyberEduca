import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsUUID, Min, ValidateNested } from 'class-validator';
import { RespostaSimulacaoDto } from '../../admin/dto/responder-simulacao.dto';

export class FinalizarSimulacaoDto {
  @IsOptional()
  @IsBoolean()
  refazer?: boolean;

  @IsOptional()
  @IsUUID()
  tentativaId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  acertos?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalQuestoes?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RespostaSimulacaoDto)
  respostas: RespostaSimulacaoDto[];
}
