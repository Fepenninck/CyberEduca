import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrivacidadeService {
  constructor(private readonly prisma: PrismaService) {}

  async atuais() {
    const termos = await this.prisma.politicaPrivacidade.findFirst({
      orderBy: { id: 'desc' },
    });
    if (!termos)
      throw new ServiceUnavailableException(
        'A política de privacidade ainda não está disponível.',
      );
    return {
      version: termos.versao,
      conteudo: termos.conteudo,
      publicadoEm: termos.publicadoEm,
    };
  }

  historico() {
    return this.prisma.politicaPrivacidade.findMany({
      orderBy: { id: 'desc' },
      take: 20,
      select: { versao: true, publicadoEm: true },
    });
  }

  async publicar(dados: {
    versao: string;
    conteudo: string;
    versaoAnterior: string;
  }) {
    try {
      await this.prisma.$transaction(
        async (tx) => {
          const atuais = await tx.politicaPrivacidade.findFirst({
            orderBy: { id: 'desc' },
          });
          if (!atuais || atuais.versao !== dados.versaoAnterior) {
            throw new ConflictException(
              'Outra versão foi publicada. Recarregue a política antes de continuar.',
            );
          }
          if (atuais.versao === dados.versao) {
            throw new ConflictException(
              'Informe uma nova versão para publicar alterações na política.',
            );
          }
          await tx.politicaPrivacidade.create({
            data: {
              versao: dados.versao,
              conteudo: dados.conteudo,
              publicadoEm: new Date(),
            },
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
          'Esta versão já existe ou outra publicação foi concluída. Recarregue a política e use uma versão inédita.',
        );
      }
      throw error;
    }
    return this.atuais();
  }
}
