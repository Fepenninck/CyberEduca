import { IsString, MaxLength } from 'class-validator';

export class CriarCategoriaSimulacaoDto {
  @IsString()
  @MaxLength(120)
  nome: string;

  @IsString()
  @MaxLength(1000)
  descricao: string;
}
