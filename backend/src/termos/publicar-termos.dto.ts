import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

const Trim = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );

export class PublicarTermosDto {
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, {
    message: 'Use letras, números, pontos, hífens ou sublinhados na versão.',
  })
  versao: string;

  @Trim()
  @IsString()
  @MinLength(20, {
    message: 'O texto do documento deve ter pelo menos 20 caracteres.',
  })
  @MaxLength(100_000)
  conteudo: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  versaoAnterior: string;
}
