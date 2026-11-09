import { IsBoolean } from 'class-validator';

export class ResponderCenarioDto {
  @IsBoolean()
  respostaEhPhishing!: boolean;
}