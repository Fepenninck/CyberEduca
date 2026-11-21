import { Equals, IsBoolean } from 'class-validator';
import { TERMOS_VERSAO } from '../termos';

export class AceitarTermosDto {
  @IsBoolean()
  @Equals(true, { message: 'Aceite os Termos de Uso para continuar.' })
  acceptedTerms: boolean;

  @Equals(TERMOS_VERSAO, {
    message: 'A versao dos termos mudou. Atualize a pagina e leia os termos.',
  })
  termsVersion: string;
}
