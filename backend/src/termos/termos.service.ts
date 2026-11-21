import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TermosService {
  constructor(private readonly prisma: PrismaService) {}

  async atuais() {
    const termos = await this.prisma.termosUso.findFirst({
      orderBy: { id: 'desc' },
    });
    if (!termos)
      throw new ServiceUnavailableException(
        'Os Termos de Uso ainda não estão disponíveis.',
      );
    return {
      termsVersion: termos.versao,
      conteudo: termos.conteudo,
      publicadoEm: termos.publicadoEm,
    };
  }

  historico() {
    return this.prisma.termosUso.findMany({
      orderBy: { id: 'desc' },
      take: 20,
      select: { versao: true, publicadoEm: true },
    });
  }

  async validarAceite(aceite: {
    acceptedTerms: boolean;
    termsVersion: string;
  }) {
    const atuais = await this.atuais();
    if (
      aceite.acceptedTerms !== true ||
      aceite.termsVersion !== atuais.termsVersion
    ) {
      throw new BadRequestException(
        'Os termos foram atualizados. Recarregue a página, leia e aceite a versão atual.',
      );
    }
    return atuais.termsVersion;
  }

  async publicar(dados: {
    versao: string;
    conteudo: string;
    versaoAnterior: string;
  }) {
    try {
      await this.prisma.$transaction(
        async (tx) => {
          const atuais = await tx.termosUso.findFirst({
            orderBy: { id: 'desc' },
          });
          if (!atuais || atuais.versao !== dados.versaoAnterior) {
            throw new ConflictException(
              'Outra versão foi publicada. Recarregue os termos antes de continuar.',
            );
          }
          if (atuais.versao === dados.versao) {
            throw new ConflictException(
              'Informe uma nova versão para publicar alterações nos termos.',
            );
          }
          await tx.termosUso.create({
            data: { versao: dados.versao, conteudo: dados.conteudo },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2002', 'P2034'].includes(error.code)
      ) {
        throw new ConflictException(
          'Esta versão já existe ou outra publicação foi concluída. Recarregue os termos e use uma versão inédita.',
        );
      }
      throw error;
    }
    return this.atuais();
  }
}
