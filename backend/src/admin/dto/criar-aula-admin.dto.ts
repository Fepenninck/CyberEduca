import { IsInt, IsString, Min } from 'class-validator';

export class CriarAulaAdminDto {
  @IsString()
  titulo: string;

  @IsString()
  conteudo: string;

  @IsInt()
  @Min(1)
  ordem: number;

  @IsString()
  trilhaId: string;
}
