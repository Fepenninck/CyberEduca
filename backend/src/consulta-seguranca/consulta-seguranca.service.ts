import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { ResultadoConsultaSeguranca } from '@prisma/client';
import { isIP } from 'node:net';
import { domainToASCII } from 'node:url';
import { isFQDN } from 'class-validator';
import { PrismaService } from '../prisma.service';
import { VirusTotalService } from './virustotal.service';
import type { EstatisticasVirusTotal } from './virustotal.service';

@Injectable()
export class ConsultaSegurancaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly virusTotal: VirusTotalService,
  ) {}

  normalizarDominio(entrada: string): string {
    const texto = entrada.trim().toLowerCase();

    // O campo recebe somente domínio, sem protocolo,
    // caminho, porta, parâmetros ou credenciais.
    if (/[\s/:\\?#@%]/.test(texto)) {
      throw new BadRequestException(
        'Informe somente o domínio, como exemplo.com, sem https:// ou caminhos.',
      );
    }

    // Aceita um ponto final de DNS e o remove.
    const semPontoFinal = texto.endsWith('.')
      ? texto.slice(0, -1)
      : texto;

    const dominio = domainToASCII(semPontoFinal);

    if (
      !dominio ||
      dominio.length > 253 ||
      isIP(dominio) !== 0 ||
      !isFQDN(dominio, {
        require_tld: true,
        allow_underscores: false,
        allow_trailing_dot: false,
        allow_numeric_tld: false,
        allow_wildcard: false,
      })
    ) {
      throw new BadRequestException(
        'Informe um domínio válido, como exemplo.com.',
      );
    }

    const sufixosLocais = [
      'localhost',
      'local',
      'internal',
      'lan',
      'home',
      'test',
      'invalid',
    ];

    if (
      sufixosLocais.some(
        (sufixo) =>
          dominio === sufixo ||
          dominio.endsWith(`.${sufixo}`),
      )
    ) {
      throw new BadRequestException(
        'Informe um domínio público, sem endereços locais ou de teste.',
      );
    }

    return dominio;
  }

  interpretarResultado(
    estatisticas: EstatisticasVirusTotal | null,
  ): ResultadoConsultaSeguranca {
    if (!estatisticas) {
      return ResultadoConsultaSeguranca.SEM_DADOS;
    }

    if (estatisticas.malicious > 0) {
      return ResultadoConsultaSeguranca.MALICIOSO;
    }

    if (estatisticas.suspicious > 0) {
      return ResultadoConsultaSeguranca.SUSPEITO;
    }

    if (
      estatisticas.harmless > 0 ||
      estatisticas.undetected > 0
    ) {
      return ResultadoConsultaSeguranca.SEM_DETECCOES;
    }

    return ResultadoConsultaSeguranca.SEM_DADOS;
  }

  registrarConsulta(
    usuarioId: string,
    dominio: string,
    resultado: ResultadoConsultaSeguranca,
  ) {
    return this.prisma.consultaSeguranca.create({
      data: {
        usuarioId,
        dominio,
        provedor: 'VIRUSTOTAL',
        resultado,
      },
    });
  }

  async consultarDominio(
    usuarioId: string,
    entrada: string,
  ) {
    const dominio = this.normalizarDominio(entrada);

    const estatisticas =
      await this.virusTotal.obterRelatorioVirusTotal(dominio);

    const resultado = this.interpretarResultado(estatisticas);

    const consulta = await this.registrarConsulta(
      usuarioId,
      dominio,
      resultado,
    );

    return {
      dominio: consulta.dominio,
      resultado: consulta.resultado,
      deteccoesMaliciosas: estatisticas?.malicious ?? 0,
      deteccoesSuspeitas: estatisticas?.suspicious ?? 0,
      consultadoEm: consulta.consultadoEm,
    };
  }
}