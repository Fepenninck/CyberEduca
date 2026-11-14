import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';
import { CriarSimulacaoDto } from '../admin/dto/criar-simulacao.dto';
import { AtualizarSimulacaoDto } from '../admin/dto/atualizar-simulacao.dto';
import { RespostaSimulacaoDto } from '../admin/dto/responder-simulacao.dto';
import { FinalizarSimulacaoDto } from './dto/finalizar-simulacao.dto';
import { CriarCategoriaSimulacaoDto } from '../admin/dto/criar-categoria-simulacao.dto';

const incluirConteudo = {
  questoes: {
    orderBy: [{ ordem: 'asc' as const }, { id: 'asc' as const }],
    include: { alternativas: { orderBy: [{ ordem: 'asc' as const }, { id: 'asc' as const }] } },
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

  listarParaAluno(usuarioId?: string) {
    return this.prisma.simulacao.findMany({
      where: { questoes: { some: {} } },
      orderBy: { criadoEm: 'desc' },
      select: {
        id: true,
        titulo: true,
        descricao: true,
        criadoEm: true,
        nivel: true,
        duracaoMinutos: true,
        categoria: { select: { id: true, nome: true } },
        resultados: { where: { usuarioId: usuarioId ?? '' }, orderBy: { criadoEm: 'desc' }, take: 1, select: { acertos: true, totalQuestoes: true, criadoEm: true } },
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

  async buscarCategoriaParaAluno(id: string, usuarioId?: string) {
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
    const resultados = usuarioId ? await this.prisma.resultadoSimulacao.findMany({
      where: { usuarioId, simulacaoId: { in: categoria.simulacoes.map((simulacao) => simulacao.id) } },
      select: { simulacaoId: true },
    }) : [];
    const concluidas = new Set(resultados.map((resultado) => resultado.simulacaoId));
    return { ...categoria, simulacoes: categoria.simulacoes.map((simulacao) => ({ ...simulacao, concluida: concluidas.has(simulacao.id) })) };
  }

  async buscarParaAluno(id: string, usuarioId?: string) {

    const simulacao = await this.prisma.simulacao.findUnique({
      where: { id },
      select: {
        id: true,
        titulo: true,
        descricao: true,
        nivel: true,
        duracaoMinutos: true,
        categoria: { select: { id: true, nome: true } },
        questoes: {
          orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
          select: {
            id: true,
            enunciado: true,
            contexto: true,
            alternativas: {
              orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
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
          nivel: dados.nivel,
          duracaoMinutos: dados.duracaoMinutos,
          categoriaId: dados.categoriaId,
          ...(dados.questoes?.length
            ? {
                questoes: {
                  create: dados.questoes.map((questao, ordem) => ({
                    enunciado: questao.enunciado, contexto: questao.contexto, explicacao: questao.explicacao, ordem,
                    alternativas: { create: (questao.alternativas ?? []).map((alternativa, ordem) => ({ ...alternativa, ordem })) },
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
          data: { titulo: dados.titulo, descricao: dados.descricao, nivel: dados.nivel, duracaoMinutos: dados.duracaoMinutos, categoriaId: dados.categoriaId },
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
          nivel: dados.nivel,
          duracaoMinutos: dados.duracaoMinutos,
            categoriaId: dados.categoriaId,
            questoes: {
              create: dados.questoes!.map((questao, ordem) => ({
                enunciado: questao.enunciado, contexto: questao.contexto, explicacao: questao.explicacao, ordem,
                alternativas: { create: (questao.alternativas ?? []).map((alternativa, ordem) => ({ ...alternativa, ordem })) },
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
    const simulacao = await this.prisma.simulacao.findUnique({
      where: { id },
      select: {
        questoes: {
          orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
          select: {
            id: true,
            enunciado: true,
            contexto: true,
            explicacao: true,
            alternativas: { select: { id: true, texto: true, isCorreta: true } },
          },
        },
      },
    });
    if (!simulacao) throw new NotFoundException('Simulação não encontrada.');

    if (!simulacao.questoes.length || respostas.length !== simulacao.questoes.length || new Set(respostas.map(resposta => resposta.questaoId)).size !== respostas.length) {
      throw new BadRequestException('Responda cada decisão da simulação uma única vez.');
    }
    for (const resposta of respostas) {
      const questao = simulacao.questoes.find(item => item.id === resposta.questaoId);
      if (!questao || !questao.alternativas.some(item => item.id === resposta.alternativaId)) throw new BadRequestException('Uma das respostas não pertence a esta simulação.');
    }
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
          enunciado: questao.enunciado,
          contexto: questao.contexto,
          explicacao: questao.explicacao,
          textoEscolhido: escolhida?.texto ?? null,
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

    const resultado = await this.prisma.resultadoSimulacao.findFirst({
      where: { usuarioId, simulacaoId: id },
      orderBy: [{ criadoEm: 'desc' }, { id: 'desc' }],
      select: { acertos: true, totalQuestoes: true, criadoEm: true, respostas: true },
    });

    return {
      concluida: Boolean(resultado),
      resultado: resultado ? { ...resultado, respostas: Array.isArray(resultado.respostas) ? resultado.respostas : [], titulo: simulacao.titulo } : null,
    };
  }

  async finalizarParaAluno(
    id: string,
    usuarioId: string,
    dados: FinalizarSimulacaoDto,
  ) {
    const existente = await this.prisma.resultadoSimulacao.findFirst({
      where: { usuarioId, simulacaoId: id },
      orderBy: [{ criadoEm: 'desc' }, { id: 'desc' }],
      select: { acertos: true, totalQuestoes: true, criadoEm: true, respostas: true },
    });
    if (existente && !dados.refazer) {
      const simulacao = await this.prisma.simulacao.findUnique({
        where: { id },
        select: { titulo: true },
      });
      if (!simulacao) throw new NotFoundException('Simulação não encontrada.');
      return {
        ...existente,
        titulo: simulacao.titulo,
        respostas: Array.isArray(existente.respostas) ? existente.respostas : [],
        jaConcluida: true,
      };
    }

    if (dados.refazer && !dados.tentativaId) throw new BadRequestException('Identifique a nova tentativa para refazer a simulação.');
    if (dados.tentativaId) {
      const tentativa = await this.prisma.resultadoSimulacao.findUnique({ where: { id: dados.tentativaId } });
      if (tentativa && (tentativa.usuarioId !== usuarioId || tentativa.simulacaoId !== id)) throw new BadRequestException('Tentativa inválida.');
      if (tentativa) {
        const simulacao = await this.prisma.simulacao.findUnique({ where: { id }, select: { titulo: true } });
        if (!simulacao) throw new NotFoundException('Simulação não encontrada.');
        return { acertos: tentativa.acertos, totalQuestoes: tentativa.totalQuestoes, criadoEm: tentativa.criadoEm,
          respostas: Array.isArray(tentativa.respostas) ? tentativa.respostas : [], titulo: simulacao.titulo, jaConcluida: true };
      }
    }
    const corrigido = await this.responder(id, dados.respostas, usuarioId);
    const acertosCalculados = corrigido.respostas.filter((resposta) => resposta.correta).length;
    const totalCalculado = corrigido.respostas.length;
    if ((dados.acertos !== undefined && dados.acertos !== acertosCalculados) || (dados.totalQuestoes !== undefined && dados.totalQuestoes !== totalCalculado)) {
      throw new BadRequestException('O resultado enviado não corresponde às respostas do treino.');
    }

    const [simulacao, resultado] = await Promise.all([
      this.prisma.simulacao.findUnique({ where: { id }, select: { titulo: true } }),
      this.prisma.resultadoSimulacao.upsert({
        where: { id: dados.tentativaId ?? randomUUID() },
        update: {},
        create: {
          ...(dados.tentativaId ? { id: dados.tentativaId } : {}),
          usuarioId,
          simulacaoId: id,
          acertos: acertosCalculados,
          totalQuestoes: totalCalculado,
          respostas: corrigido.respostas as unknown as Prisma.InputJsonValue,
        },
        select: { usuarioId: true, simulacaoId: true, acertos: true, totalQuestoes: true, criadoEm: true, respostas: true },
      }),
    ]);
    if (!simulacao) throw new NotFoundException('Simulação não encontrada.');
    if (resultado.usuarioId !== usuarioId || resultado.simulacaoId !== id) throw new BadRequestException('Tentativa inválida.');

    return {
      acertos: resultado.acertos, totalQuestoes: resultado.totalQuestoes, criadoEm: resultado.criadoEm,
      respostas: Array.isArray(resultado.respostas) ? resultado.respostas : [],
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
