import { StatusProva } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class AlterarStatusProvaDto {
  @IsEnum(StatusProva)
  status: StatusProva;
}
