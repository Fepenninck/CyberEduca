import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';

export class RespostaSimulacaoDto {
  @IsString()
  questaoId: string;

  @IsString()
  alternativaId: string;
}

export class EnviarRespostasSimulacaoDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RespostaSimulacaoDto)
  respostas: RespostaSimulacaoDto[];
}
