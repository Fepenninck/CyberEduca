import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AcaoAuditoria } from '@prisma/client';
import { AuditoriaService } from '../auditoria.service';

type TrilhaListada = {
  id: string;
  titulo: string;
  descricao: string;
  nivel: string;
  bloqueada: boolean;
  ordem: number;
  _count: { aulas: number };
};

type AulaResumida = {
  id: string;
  titulo: string;
  ordem: number;
};

@Injectable()
export class AprendizagemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}
  async criarTrilha(dados: {
    titulo: string;
    descricao: string;
    bloqueada?: boolean;
    ordem: number;
  }) {
    return this.prisma.trilha.create({
      data: dados,
    });
  }

  async editarTrilha(
    id: string,
    dados: {
      titulo?: string;
      descricao?: string;
      bloqueada?: boolean;
      ordem?: number;
    },
  ) {
    return this.prisma.trilha.update({
      where: { id },
      data: dados,
    });
  }

  async criarAula(dados: {
    titulo: string;
    conteudo: string;
    ordem: number;
    trilhaId: string;
  }) {
    return this.prisma.aula.create({
      data: dados,
    });
  }

  async editarAula(
    id: string,
    dados: {
      titulo?: string;
      conteudo?: string;
      ordem?: number;
      trilhaId?: string;
    },
  ) {
    return this.prisma.aula.update({
      where: { id },
      data: dados,
    });
  }

  async listarTrilhas(usuarioId: string) {
    const trilhas = await this.prisma.trilha.findMany({
      orderBy: { ordem: 'asc' },
      include: { _count: { select: { aulas: true } } },
    });

    return Promise.all(
      trilhas.map(async (t: TrilhaListada) => ({
        id: t.id,
        titulo: t.titulo,
        descricao: t.descricao,
        nivel: t.nivel,
        bloqueada: await this.estaBloqueada(t, usuarioId),
        totalAulas: t._count.aulas,
        percentual: await this.calcularPercentual(t.id, usuarioId),
      })),
    );
  }

  async detalharTrilha(id: string, usuarioId: string) {
    const trilha = await this.prisma.trilha.findUnique({
      where: { id },
      include: { aulas: { orderBy: { ordem: 'asc' } } },
    });

    if (!trilha) {
      throw new NotFoundException('Trilha nao encontrada');
    }
    if (await this.estaBloqueada(trilha, usuarioId)) {
      throw new ForbiddenException(
        'Conclua as trilhas anteriores para desbloquear este conteúdo.',
      );
    }

    const concluidas = await this.prisma.progressoAula.findMany({
      where: {
        usuarioId,
        concluida: true,
        aula: {
          trilhaId: id,
        },
      },
      select: {
        aulaId: true,
      },
    });
    const idsConcluidas = new Set(
      concluidas.map((c: { aulaId: string }) => c.aulaId),
    );

    return {
      id: trilha.id,
      titulo: trilha.titulo,
      descricao: trilha.descricao,
      nivel: trilha.nivel,
      bloqueada: false,
      percentual: await this.calcularPercentual(id, usuarioId),
      aulas: trilha.aulas.map((a: AulaResumida) => ({
        id: a.id,
        titulo: a.titulo,
        ordem: a.ordem,
        concluida: idsConcluidas.has(a.id),
      })),
    };
  }

  async buscarAula(id: string, usuarioId: string) {
    const aula = await this.prisma.aula.findUnique({
      where: { id },
      include: {
        trilha: {
          select: {
            id: true,
            titulo: true,
            nivel: true,
            bloqueada: true,
            ordem: true,
          },
        },
      },
    });

    if (!aula) {
      throw new NotFoundException('Aula nao encontrada');
    }
    if (await this.estaBloqueada(aula.trilha, usuarioId)) {
      throw new ForbiddenException(
        'Conclua as trilhas anteriores para desbloquear este conteúdo.',
      );
    }

    const progresso = await this.prisma.progressoAula.findUnique({
      where: {
        usuarioId_aulaId: { usuarioId, aulaId: id },
      },
    });

    const [anterior, proxima] = await Promise.all([
      this.prisma.aula.findFirst({
        where: { trilhaId: aula.trilhaId, ordem: { lt: aula.ordem } },
        orderBy: { ordem: 'desc' },
        select: { id: true, titulo: true, ordem: true },
      }),
      this.prisma.aula.findFirst({
        where: { trilhaId: aula.trilhaId, ordem: { gt: aula.ordem } },
        orderBy: { ordem: 'asc' },
        select: { id: true, titulo: true, ordem: true },
      }),
    ]);

    return {
      id: aula.id,
      titulo: aula.titulo,
      conteudo: aula.conteudo,
      ordem: aula.ordem,
      trilha: {
        id: aula.trilha.id,
        titulo: aula.trilha.titulo,
        nivel: aula.trilha.nivel,
      },
      concluida: progresso?.concluida ?? false,
      anterior,
      proxima,
    };
  }

  async concluirAula(aulaId: string, usuarioId: string) {
    const aula = await this.prisma.aula.findUnique({ where: { id: aulaId } });

    if (!aula) {
      throw new NotFoundException('Aula nao encontrada');
    }

    await this.prisma.progressoAula.upsert({
      where: {
        usuarioId_aulaId: { usuarioId, aulaId },
      },
      update: { concluida: true, dataConclusao: new Date() },
      create: { usuarioId, aulaId, concluida: true },
    });

    await this.auditoria.registrar({
      acao: AcaoAuditoria.CONCLUIR_AULA,
      entidade: 'Aula',
      entidadeId: aulaId,
      atorId: usuarioId,
      dadosNovos: {
        concluida: true,
        trilhaId: aula.trilhaId,
      },
    });

    return {
      aulaId,
      concluida: true,
      percentualTrilha: await this.calcularPercentual(aula.trilhaId, usuarioId),
    };
  }

  async progressoGeral(usuarioId: string) {
    return this.listarTrilhas(usuarioId);
  }

  private async calcularPercentual(
    trilhaId: string,
    usuarioId: string,
  ): Promise<number> {
    const total = await this.prisma.aula.count({
      where: { trilhaId },
    });

    if (total === 0) return 0;

    const feitas = await this.prisma.progressoAula.count({
      where: {
        usuarioId,
        concluida: true,
        aula: { trilhaId },
      },
    });

    return Math.round((feitas / total) * 100);
  }
  private async estaBloqueada(
    trilha: { bloqueada: boolean; ordem: number },
    usuarioId: string,
  ): Promise<boolean> {
    if (!trilha.bloqueada) return false;

    const anteriores = await this.prisma.trilha.findMany({
      where: {
        ordem: { lt: trilha.ordem },
      },
      select: { id: true },
    });

    if (anteriores.length === 0) return false;

    const percentuais = await Promise.all(
      anteriores.map((anterior: { id: string }) =>
        this.calcularPercentual(anterior.id, usuarioId),
      ),
    );

    return percentuais.some((percentual) => percentual < 100);
  }
}
