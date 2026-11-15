import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { CriarQuestaoDto } from './criar-questao.dto';
import { CriarAlternativaDto } from './criar-alternativa.dto';

export class CriarQuestaoCompletaDto extends CriarQuestaoDto {
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => CriarAlternativaDto)
  alternativas!: CriarAlternativaDto[];
}
