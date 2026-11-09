import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CriarSimulacaoDto } from '../admin/dto/criar-simulacao.dto';
import { AtualizarSimulacaoDto } from '../admin/dto/atualizar-simulacao.dto';
import { RespostaSimulacaoDto } from '../admin/dto/responder-simulacao.dto';
import { FinalizarSimulacaoDto } from './dto/finalizar-simulacao.dto';
import { CriarCategoriaSimulacaoDto } from '../admin/dto/criar-categoria-simulacao.dto';

const incluirConteudo = {
  questoes: {
    orderBy: { id: 'asc' as const },
    include: { alternativas: { orderBy: { id: 'asc' as const } } },
  },
};

@Injectable()
export class SimulacoesService {
  constructor(private readonly prisma: PrismaService) {}

  listarAdmin() {
    return this.prisma.simulacao.findMany({
      orderBy: { criadoEm: 'desc' },
      include: { ...incluirConteudo, categoria: true },
    });
  }

  async buscarAdmin(id: string) {
    const simulacao = await this.prisma.simulacao.findUnique({
      where: { id },
      include: { ...incluirConteudo, categoria: true },
    });
    if (!simulacao) throw new NotFoundException('Simulação não encontrada.');
    return simulacao;
  }

  listarParaAluno() {
    return this.prisma.simulacao.findMany({
      orderBy: { criadoEm: 'desc' },
      select: {
        id: true,
        titulo: true,
        descricao: true,
        criadoEm: true,
        _count: { select: { questoes: true } },
      },
    });
  }

  listarCategoriasAdmin() {
    return this.prisma.categoriaSimulacao.findMany({
      orderBy: { nome: 'asc' },
      include: { simulacoes: true },
    });
  }

  criarCategoria(dados: CriarCategoriaSimulacaoDto) {
    return this.prisma.categoriaSimulacao.create({
      data: { nome: dados.nome.trim(), descricao: dados.descricao.trim() },
      include: { simulacoes: true },
    });
  }

  async excluirCategoria(id: string) {
    const categoria = await this.prisma.categoriaSimulacao.findUnique({
      where: { id },
      select: { id: true, _count: { select: { simulacoes: true } } },
    });
    if (!categoria) throw new NotFoundException('Categoria de simulação não encontrada.');
    if (categoria._count.simulacoes > 0) {
      throw new ConflictException('Remova ou mova as simulações antes de excluir esta categoria.');
    }
    return this.prisma.categoriaSimulacao.delete({ where: { id } });
  }

  listarCategoriasParaAluno() {
    return this.prisma.categoriaSimulacao.findMany({
      orderBy: { nome: 'asc' },
      select: {
        id: true,
        nome: true,
        descricao: true,
        criadoEm: true,
        simulacoes: {
          orderBy: { criadoEm: 'desc' },
          select: { id: true, titulo: true, descricao: true, criadoEm: true },
        },
      },
    });
  }

  async buscarCategoriaParaAluno(id: string) {
    const categoria = await this.prisma.categoriaSimulacao.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        descricao: true,
        simulacoes: {
          orderBy: { criadoEm: 'desc' },
          select: { id: true, titulo: true, descricao: true, criadoEm: true },
        },
      },
    });
    if (!categoria) throw new NotFoundException('Categoria de simulação não encontrada.');
    return categoria;
  }

  async buscarParaAluno(id: string, usuarioId?: string) {
    if (usuarioId) {
      const concluida = await this.prisma.resultadoSimulacao.findUnique({
        where: { usuarioId_simulacaoId: { usuarioId, simulacaoId: id } },
        select: { id: true },
      });
      if (concluida) throw new ConflictException('Você já concluiu esta simulação.');
    }

    const simulacao = await this.prisma.simulacao.findUnique({
      where: { id },
      select: {
        id: true,
        titulo: true,
        descricao: true,
        questoes: {
          orderBy: { id: 'asc' },
          select: {
            id: true,
            enunciado: true,
            alternativas: {
              orderBy: { id: 'asc' },
              select: { id: true, texto: true },
            },
          },
        },
      },
    });
    if (!simulacao) throw new NotFoundException('Simulação não encontrada.');
    return simulacao;
  }

  async criar(dados: CriarSimulacaoDto) {
    this.validarQuestoes(dados.questoes);
    try {
      return await this.prisma.simulacao.create({
        data: {
          titulo: dados.titulo,
          descricao: dados.descricao,
          categoriaId: dados.categoriaId,
          ...(dados.questoes?.length
            ? {
                questoes: {
                  create: dados.questoes.map((questao) => ({
                    enunciado: questao.enunciado,
                    alternativas: { create: questao.alternativas ?? [] },
                  })),
                },
              }
            : {}),
        },
        include: { ...incluirConteudo, categoria: true },
      });
    } catch (error) {
      console.error('Erro Prisma ao criar simulação:', error);
      throw new BadRequestException(this.mensagemErro(error));
    }
  }

  async atualizar(id: string, dados: AtualizarSimulacaoDto) {
    if (dados.questoes !== undefined) this.validarQuestoes(dados.questoes);

    try {
      if (dados.questoes === undefined) {
        return await this.prisma.simulacao.update({
          where: { id },
          data: { titulo: dados.titulo, descricao: dados.descricao, categoriaId: dados.categoriaId },
          include: { ...incluirConteudo, categoria: true },
        });
      }

      return await this.prisma.$transaction(async (tx) => {
        await tx.questaoSimulacao.deleteMany({ where: { simulacaoId: id } });
        return tx.simulacao.update({
          where: { id },
          data: {
            titulo: dados.titulo,
            descricao: dados.descricao,
            categoriaId: dados.categoriaId,
            questoes: {
              create: dados.questoes!.map((questao) => ({
                enunciado: questao.enunciado,
                alternativas: { create: questao.alternativas ?? [] },
              })),
            },
          },
          include: { ...incluirConteudo, categoria: true },
        });
      });
    } catch (error) {
      console.error('Erro Prisma ao atualizar simulação:', error);
      throw new BadRequestException(this.mensagemErro(error));
    }
  }

  async excluir(id: string) {
    try {
      return await this.prisma.simulacao.delete({ where: { id } });
    } catch (error) {
      console.error('Erro Prisma ao excluir simulação:', error);
      throw new BadRequestException(this.mensagemErro(error));
    }
  }

  async responder(id: string, respostas: RespostaSimulacaoDto[], usuarioId?: string) {
    if (usuarioId) {
      const concluida = await this.prisma.resultadoSimulacao.findUnique({
        where: { usuarioId_simulacaoId: { usuarioId, simulacaoId: id } },
        select: { id: true },
      });
      if (concluida) throw new ConflictException('Você já concluiu esta simulação.');
    }
    const simulacao = await this.prisma.simulacao.findUnique({
      where: { id },
      select: {
        questoes: {
          select: {
            id: true,
            alternativas: { select: { id: true, texto: true, isCorreta: true } },
          },
        },
      },
    });
    if (!simulacao) throw new NotFoundException('Simulação não encontrada.');

    const respostaPorQuestao = new Map(
      respostas.map((resposta) => [resposta.questaoId, resposta.alternativaId]),
    );
    return {
      respostas: simulacao.questoes.map((questao) => {
        const alternativaId = respostaPorQuestao.get(questao.id);
        const escolhida = questao.alternativas.find((item) => item.id === alternativaId);
        const correta = questao.alternativas.find((item) => item.isCorreta);
        return {
          questaoId: questao.id,
          alternativaEscolhidaId: alternativaId ?? null,
          correta: Boolean(escolhida?.isCorreta),
          alternativaCorretaId: correta?.id ?? null,
          textoCorreto: correta?.texto ?? null,
        };
      }),
    };
  }

  async statusDoAluno(id: string, usuarioId: string) {
    const simulacao = await this.prisma.simulacao.findUnique({
      where: { id },
      select: { id: true, titulo: true },
    });
    if (!simulacao) throw new NotFoundException('Simulação não encontrada.');

    const resultado = await this.prisma.resultadoSimulacao.findUnique({
      where: { usuarioId_simulacaoId: { usuarioId, simulacaoId: id } },
      select: { acertos: true, totalQuestoes: true, criadoEm: true },
    });

    return {
      concluida: Boolean(resultado),
      resultado: resultado ? { ...resultado, titulo: simulacao.titulo } : null,
    };
  }

  async finalizarParaAluno(
    id: string,
    usuarioId: string,
    dados: FinalizarSimulacaoDto,
  ) {
    const existente = await this.prisma.resultadoSimulacao.findUnique({
      where: { usuarioId_simulacaoId: { usuarioId, simulacaoId: id } },
      select: { acertos: true, totalQuestoes: true, criadoEm: true },
    });
    if (existente) {
      const simulacao = await this.prisma.simulacao.findUnique({
        where: { id },
        select: { titulo: true },
      });
      if (!simulacao) throw new NotFoundException('Simulação não encontrada.');
      return {
        ...existente,
        titulo: simulacao.titulo,
        respostas: [],
        jaConcluida: true,
      };
    }

    const corrigido = await this.responder(id, dados.respostas, usuarioId);
    const acertosCalculados = corrigido.respostas.filter((resposta) => resposta.correta).length;
    const totalCalculado = corrigido.respostas.length;
    if (dados.acertos !== acertosCalculados || dados.totalQuestoes !== totalCalculado) {
      throw new BadRequestException('O resultado enviado não corresponde às respostas do treino.');
    }

    const [simulacao, resultado] = await Promise.all([
      this.prisma.simulacao.findUnique({ where: { id }, select: { titulo: true } }),
      this.prisma.resultadoSimulacao.upsert({
        where: { usuarioId_simulacaoId: { usuarioId, simulacaoId: id } },
        update: {},
        create: {
          usuarioId,
          simulacaoId: id,
          acertos: acertosCalculados,
          totalQuestoes: totalCalculado,
        },
        select: { acertos: true, totalQuestoes: true, criadoEm: true },
      }),
    ]);
    if (!simulacao) throw new NotFoundException('Simulação não encontrada.');

    return {
      ...corrigido,
      ...resultado,
      titulo: simulacao.titulo,
      jaConcluida: false,
    };
  }

  private validarQuestoes(questoes?: Array<{
    enunciado: string;
    alternativas?: Array<{ isCorreta: boolean }>;
  }>) {
    for (const questao of questoes ?? []) {
      const alternativas = questao.alternativas ?? [];
      if (
        alternativas.length < 2 ||
        alternativas.filter((alternativa) => alternativa.isCorreta).length !== 1
      ) {
        throw new BadRequestException(
          'Cada questão precisa de ao menos duas alternativas e exatamente uma correta.',
        );
      }
    }
  }

  private mensagemErro(error: unknown) {
    return error instanceof Error
      ? error.message
      : 'Não foi possível concluir a operação da simulação.';
  }
}
