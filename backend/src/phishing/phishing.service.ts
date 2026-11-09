import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CriarCenarioDto } from './dto/criar-cenario.dto';
import { AtualizarCenarioDto } from './dto/atualizar-cenario.dto';
import { ResponderCenarioDto } from './dto/responder-cenario.dto';

@Injectable()
export class PhishingService {
  constructor(private readonly prisma: PrismaService) {}

  private async executarTransacao<T>(
    operacao: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    for (let tentativa = 0; tentativa < 3; tentativa++) {
      try {
        return await this.prisma.$transaction(operacao, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (erro) {
        if (erro instanceof Prisma.PrismaClientKnownRequestError) {
          if (erro.code === 'P2034') {
            if (tentativa < 2) continue;

            throw new ConflictException(
              'Outra operação alterou estes dados. Tente novamente.',
            );
          }

          if (erro.code === 'P2003') {
            throw new BadRequestException(
              'Um dos registros relacionados não está disponível.',
            );
          }
        }

        throw erro;
      }
    }

    throw new ConflictException('Não foi possível concluir a operação.');
  }

  private async exigirAula(tx: Prisma.TransactionClient, aulaId: string) {
    const aula = await tx.aula.findUnique({
      where: { id: aulaId },
      select: { id: true },
    });

    if (!aula) {
      throw new NotFoundException('Aula não encontrada.');
    }
  }

  private async exigirRascunho(
    tx: Prisma.TransactionClient,
    cenarioId: string,
  ) {
    const cenario = await tx.cenarioPhishing.findUnique({
      where: { id: cenarioId },
    });

    if (!cenario) {
      throw new NotFoundException('Cenário não encontrado.');
    }

    if (cenario.status !== 'RASCUNHO') {
      throw new BadRequestException(
        'Somente cenários em rascunho podem ser editados.',
      );
    }

    return cenario;
  }

  // ADMINISTRAÇÃO

  listarCenariosAdmin() {
    return this.prisma.cenarioPhishing.findMany({
      orderBy: { criadoEm: 'desc' },
      include: {
        aula: {
          select: {
            id: true,
            titulo: true,
          },
        },
      },
    });
  }

  criarCenario(dto: CriarCenarioDto) {
    return this.executarTransacao(async (tx) => {
      await this.exigirAula(tx, dto.aulaId);

      return tx.cenarioPhishing.create({
        data: {
          titulo: dto.titulo,
          descricao: dto.descricao,
          conteudoMensagem: dto.conteudoMensagem,
          tipo: dto.tipo,
          ehPhishing: dto.ehPhishing,
          explicacao: dto.explicacao,
          aulaId: dto.aulaId,
        },
      });
    });
  }

  atualizarCenario(cenarioId: string, dto: AtualizarCenarioDto) {
    return this.executarTransacao(async (tx) => {
      await this.exigirRascunho(tx, cenarioId);

      const dados = {
        titulo: dto.titulo,
        descricao: dto.descricao,
        conteudoMensagem: dto.conteudoMensagem,
        tipo: dto.tipo,
        ehPhishing: dto.ehPhishing,
        explicacao: dto.explicacao,
        aulaId: dto.aulaId,
      };

      if (Object.values(dados).every((valor) => valor === undefined)) {
        throw new BadRequestException(
          'Informe pelo menos um campo para atualizar.',
        );
      }

      if (dto.aulaId !== undefined) {
        await this.exigirAula(tx, dto.aulaId);
      }

      return tx.cenarioPhishing.update({
        where: { id: cenarioId },
        data: dados,
      });
    });
  }

  publicarCenario(cenarioId: string) {
    return this.executarTransacao(async (tx) => {
      const cenario = await this.exigirRascunho(tx, cenarioId);

      if (
        !cenario.titulo.trim() ||
        !cenario.descricao.trim() ||
        !cenario.conteudoMensagem.trim() ||
        !cenario.explicacao.trim()
      ) {
        throw new BadRequestException(
          'Preencha título, descrição, mensagem e explicação antes de publicar.',
        );
      }

      await this.exigirAula(tx, cenario.aulaId);

      return tx.cenarioPhishing.update({
        where: { id: cenarioId },
        data: { status: 'PUBLICADO' },
      });
    });
  }

  arquivarCenario(cenarioId: string) {
    return this.executarTransacao(async (tx) => {
      const cenario = await tx.cenarioPhishing.findUnique({
        where: { id: cenarioId },
        select: { id: true },
      });

      if (!cenario) {
        throw new NotFoundException('Cenário não encontrado.');
      }

      return tx.cenarioPhishing.update({
        where: { id: cenarioId },
        data: { status: 'ARQUIVADO' },
      });
    });
  }

  // CONSULTA DO ALUNO

  listarCenarios(aulaId?: string) {
    return this.prisma.cenarioPhishing.findMany({
      where: {
        status: 'PUBLICADO',
        ...(aulaId ? { aulaId } : {}),
      },
      orderBy: { criadoEm: 'desc' },
      select: {
        id: true,
        titulo: true,
        descricao: true,
        tipo: true,
        aulaId: true,
        aula: {
          select: {
            id: true,
            titulo: true,
          },
        },
      },
    });
  }

  async buscarCenario(cenarioId: string) {
    const cenario = await this.prisma.cenarioPhishing.findFirst({
      where: {
        id: cenarioId,
        status: 'PUBLICADO',
      },
      select: {
        id: true,
        titulo: true,
        descricao: true,
        conteudoMensagem: true,
        tipo: true,
        aulaId: true,
        aula: {
          select: {
            id: true,
            titulo: true,
          },
        },
      },
    });

    if (!cenario) {
      throw new NotFoundException('Cenário não encontrado.');
    }

    return cenario;
  }

  // CORREÇÃO E REGISTRO DA TENTATIVA

  responderCenario(
    usuarioId: string,
    cenarioId: string,
    dto: ResponderCenarioDto,
  ) {
    return this.executarTransacao(async (tx) => {
      const cenario = await tx.cenarioPhishing.findFirst({
        where: {
          id: cenarioId,
          status: 'PUBLICADO',
        },
        select: {
          id: true,
          ehPhishing: true,
          explicacao: true,
        },
      });

      if (!cenario) {
        throw new NotFoundException('Cenário não encontrado.');
      }

      const acertou = dto.respostaEhPhishing === cenario.ehPhishing;

      const tentativa = await tx.tentativaPhishing.create({
        data: {
          usuarioId,
          cenarioId,
          respostaEhPhishing: dto.respostaEhPhishing,
          acertou,
        },
      });

      return {
        tentativaId: tentativa.id,
        cenarioId,
        acertou,
        concluido: true,
        progressoAtualizado: false,
        explicacao: cenario.explicacao,
      };
    });
  }

  retornarRascunho(cenarioId: string) {
    return this.executarTransacao(async (tx) => {
      const item = await tx.cenarioPhishing.findUnique({
        where: { id: cenarioId },
      });
      if (!item) throw new NotFoundException('Atividade não encontrada.');
      return tx.cenarioPhishing.update({
        where: { id: cenarioId },
        data: { status: 'RASCUNHO' },
      });
    });
  }
}
