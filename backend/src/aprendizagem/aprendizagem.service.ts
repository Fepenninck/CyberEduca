import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

// TODO: substituir por req.user.id quando a autenticacao estiver pronta
const USUARIO_DEMO_ID = '11111111-1111-1111-1111-111111111111';

@Injectable()
export class AprendizagemService {
  constructor(private prisma: PrismaService) {}

async criarTrilha(dados: {
  titulo: string;
  descricao: string;
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

  async listarTrilhas() {
    const trilhas = await this.prisma.trilha.findMany({
      orderBy: { ordem: 'asc' },
      include: { _count: { select: { aulas: true } } },
    });

    return Promise.all(
      trilhas.map(async (t) => ({
        id: t.id,
        titulo: t.titulo,
        descricao: t.descricao,
        totalAulas: t._count.aulas,
        percentual: await this.calcularPercentual(t.id),
      })),
    );
  }

  async detalharTrilha(id: string) {
    const trilha = await this.prisma.trilha.findUnique({
      where: { id },
      include: { aulas: { orderBy: { ordem: 'asc' } } },
    });

    if (!trilha) {
      throw new NotFoundException('Trilha nao encontrada');
    }

    const concluidas = await this.prisma.progressoAula.findMany({
      where: { usuarioId: USUARIO_DEMO_ID, aula: { trilhaId: id } },
      select: { aulaId: true },
    });
    const idsConcluidas = new Set(concluidas.map((c) => c.aulaId));

    return {
      id: trilha.id,
      titulo: trilha.titulo,
      descricao: trilha.descricao,
      percentual: await this.calcularPercentual(id),
      aulas: trilha.aulas.map((a) => ({
        id: a.id,
        titulo: a.titulo,
        ordem: a.ordem,
        concluida: idsConcluidas.has(a.id),
      })),
    };
  }

  async buscarAula(id: string) {
    const aula = await this.prisma.aula.findUnique({
      where: { id },
      include: { trilha: { select: { id: true, titulo: true } } },
    });

    if (!aula) {
      throw new NotFoundException('Aula nao encontrada');
    }

    const progresso = await this.prisma.progressoAula.findUnique({
      where: {
        usuarioId_aulaId: { usuarioId: USUARIO_DEMO_ID, aulaId: id },
      },
    });

    // A navegação é calculada pela ordem dentro da mesma trilha. Assim uma
    // aula nunca leva o aluno, por acidente, para outra trilha.
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
      trilha: aula.trilha,
      concluida: progresso?.concluida ?? false,
      anterior,
      proxima,
    };
  }

  async concluirAula(aulaId: string) {
    const aula = await this.prisma.aula.findUnique({ where: { id: aulaId } });

    if (!aula) {
      throw new NotFoundException('Aula nao encontrada');
    }

    await this.prisma.progressoAula.upsert({
      where: {
        usuarioId_aulaId: { usuarioId: USUARIO_DEMO_ID, aulaId },
      },
      update: {},
      create: { usuarioId: USUARIO_DEMO_ID, aulaId },
    });

    return {
      aulaId,
      concluida: true,
      percentualTrilha: await this.calcularPercentual(aula.trilhaId),
    };
  }

  async progressoGeral() {
    return this.listarTrilhas();
  }

  private async calcularPercentual(trilhaId: string): Promise<number> {
    const total = await this.prisma.aula.count({ where: { trilhaId } });
    if (total === 0) return 0;

    const feitas = await this.prisma.progressoAula.count({
      where: { usuarioId: USUARIO_DEMO_ID, aula: { trilhaId } },
    });

    return Math.round((feitas / total) * 100);
  }
}
