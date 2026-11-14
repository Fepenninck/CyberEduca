import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class ResponderCenarioDto {
  @IsOptional()
  @IsBoolean()
  refazer?: boolean;

  @IsOptional()
  @IsUUID()
  tentativaId?: string;

  @IsBoolean()
  respostaEhPhishing!: boolean;
}
