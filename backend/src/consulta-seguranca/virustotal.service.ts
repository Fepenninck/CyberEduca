import {
  BadGatewayException,
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

export type EstatisticasVirusTotal = {
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
  timeout: number;
};

function ehObjeto(
  valor: unknown,
): valor is Record<string, unknown> {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    !Array.isArray(valor)
  );
}

@Injectable()
export class VirusTotalService {
  async obterRelatorioVirusTotal(
    dominio: string,
  ): Promise<EstatisticasVirusTotal | null> {
    const chave = process.env.VIRUSTOTAL_API_KEY?.trim();

    if (!chave) {
      throw new ServiceUnavailableException(
        'O serviço de consulta de domínios não está configurado.',
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(
        `https://www.virustotal.com/api/v3/domains/${encodeURIComponent(dominio)}`,
        {
          method: 'GET',
          headers: {
            accept: 'application/json',
            'x-apikey': chave,
          },
          signal: controller.signal,
          redirect: 'error',
        },
      );

      if (response.status === 404) {
        return null;
      }

      if (response.status === 429) {
        throw new HttpException(
          'Limite de consultas do provedor atingido. Tente novamente mais tarde.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        throw new ServiceUnavailableException(
          'O provedor não autorizou a consulta. Verifique a configuração do backend.',
        );
      }

      if (!response.ok) {
        throw new BadGatewayException(
          'O provedor não conseguiu concluir a consulta.',
        );
      }

      const body: unknown = await response.json();

      if (!ehObjeto(body) || !ehObjeto(body.data)) {
        throw new BadGatewayException(
          'O provedor retornou uma resposta inválida.',
        );
      }

      const attributes = body.data.attributes;

      if (!ehObjeto(attributes)) {
        throw new BadGatewayException(
          'O provedor retornou uma resposta inválida.',
        );
      }

      const stats = attributes.last_analysis_stats;

      // Um relatório sem estatísticas não permite avaliar detecções.
      if (stats === undefined || stats === null) {
        return null;
      }

      if (!ehObjeto(stats)) {
        throw new BadGatewayException(
          'O provedor retornou estatísticas inválidas.',
        );
      }

      const lerContagem = (campo: string): number => {
        const valor = stats[campo];

        if (
          typeof valor !== 'number' ||
          !Number.isSafeInteger(valor) ||
          valor < 0
        ) {
          throw new BadGatewayException(
            'O provedor retornou estatísticas inválidas.',
          );
        }

        return valor;
      };

      return {
        malicious: lerContagem('malicious'),
        suspicious: lerContagem('suspicious'),
        harmless: lerContagem('harmless'),
        undetected: lerContagem('undetected'),
        timeout: lerContagem('timeout'),
      };
    } catch (erro) {
      if (erro instanceof HttpException) {
        throw erro;
      }

      if (controller.signal.aborted) {
        throw new GatewayTimeoutException(
          'O provedor demorou para responder. Tente novamente.',
        );
      }

      throw new BadGatewayException(
        'Não foi possível obter uma resposta válida do provedor.',
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}