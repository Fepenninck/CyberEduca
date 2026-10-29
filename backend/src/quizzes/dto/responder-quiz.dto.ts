import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDefined,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class RespostaQuestaoDto {
  @IsUUID()
  questaoId!: string;

  @IsUUID()
  alternativaId!: string;
}

export class ResponderQuizDto {
  @IsDefined()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique(
    (resposta: RespostaQuestaoDto | null | undefined) =>
      resposta?.questaoId,
    {
      message: 'Cada questão deve ser respondida apenas uma vez.',
    },
  )
  @ValidateNested({ each: true })
  @Type(() => RespostaQuestaoDto)
  respostas!: RespostaQuestaoDto[];
}