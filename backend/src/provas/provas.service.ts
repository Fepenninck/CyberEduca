import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StatusProva, TipoQuestao } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { RespostaQuestaoDto } from './dto/responder-prova.dto';
import { FinalizarProvaDto } from './dto/finalizar-prova.dto';

@Injectable()
export class ProvasService {
  constructor(private readonly prisma: PrismaService) {}

  async listarAdmin() {
    try {
      return await this.prisma.prova.findMany({
        orderBy: { criadoEm: 'desc' },
        include: {
          trilha: { select: { id: true, titulo: true } },
          questoes: {
            orderBy: { ordem: 'asc' },
            include: { alternativas: { orderBy: { ordem: 'asc' } } },
          },
        },
      });
    } catch (error) {
      console.error('Erro Prisma Provas:', error);
      throw new BadRequestException(this.mensagemErro(error));
    }
  }

  listarPublicadas() {
    return this.prisma.prova.findMany({
      where: { status: { in: [StatusProva.PUBLICADO, StatusProva.PUBLICADA] } },
      orderBy: { criadoEm: 'desc' },
      select: {
        id: true,
        titulo: true,
        descricao: true,
        trilha: { select: { id: true, titulo: true, nivel: true } },
        _count: { select: { questoes: true } },
      },
    });
  }

  async buscarPublicada(id: string, usuarioId?: string) {
    if (usuarioId) {
      const concluida = await this.prisma.resultadoProva.findUnique({
        where: { usuarioId_provaId: { usuarioId, provaId: id } },
        select: { id: true },
      });
      if (concluida) throw new ConflictException('Você já concluiu esta avaliação.');
    }

    const prova = await this.prisma.prova.findFirst({
      where: { id, status: { in: [StatusProva.PUBLICADO, StatusProva.PUBLICADA] } },
      select: {
        id: true,
        titulo: true,
        descricao: true,
        questoes: {
          orderBy: { ordem: 'asc' },
          select: {
            id: true,
            enunciado: true,
            tipo: true,
            alternativas: {
              orderBy: { ordem: 'asc' },
              select: { id: true, texto: true },
            },
          },
        },
      },
    });

    if (!prova) throw new NotFoundException('Prova não encontrada ou não publicada.');
    return prova;
  }

  async criar(dados: {
    titulo: string;
    descricao: string;
    trilhaId: string;
    status?: StatusProva;
    questoes?: Array<{
      enunciado: string;
      tipo: TipoQuestao;
      alternativas?: Array<{ texto: string; isCorreta: boolean }>;
    }>;
  }) {
    try {
      for (const questao of dados.questoes ?? []) {
        if (questao.tipo === TipoQuestao.MULTIPLA_ESCOLHA) {
          const alternativas = questao.alternativas ?? [];
          if (alternativas.length < 2 || alternativas.filter((item) => item.isCorreta).length !== 1) {
            throw new BadRequestException(
              'Questões de múltipla escolha precisam de pelo menos duas alternativas e exatamente uma correta.',
            );
          }
        } else if (questao.alternativas?.length) {
          throw new BadRequestException(
            'Questões dissertativas não podem conter alternativas.',
          );
        }
      }

      return await this.prisma.prova.create({
        data: {
          titulo: dados.titulo,
          descricao: dados.descricao,
          trilhaId: dados.trilhaId,
          status: dados.status ?? StatusProva.RASCUNHO,
          ...(dados.questoes?.length
            ? {
                questoes: {
                      create: dados.questoes.map((questao, indice) => ({
                        enunciado: questao.enunciado,
                        ordem: indice + 1,
                        tipo: questao.tipo,
                        ...(questao.alternativas?.length
                          ? {
                              alternativas: {
                                create: questao.alternativas.map((alternativa, alternativaIndice) => ({
                                  ...alternativa,
                                  ordem: alternativaIndice + 1,
                                })),
                              },
                            }
                          : {}),
                      })),
                },
              }
            : {}),
        },
        include: {
          trilha: { select: { id: true, titulo: true } },
          questoes: { include: { alternativas: true } },
        },
      });
    } catch (error) {
      console.error('Erro Prisma Provas:', error);
      throw new BadRequestException(this.mensagemErro(error));
    }
  }

  async atualizar(id: string, dados: {
    titulo?: string;
    descricao?: string;
    trilhaId?: string;
    status?: StatusProva;
  }) {
    try {
      return await this.prisma.prova.update({
        where: { id },
        data: dados,
        include: {
          trilha: { select: { id: true, titulo: true } },
          questoes: { include: { alternativas: true } },
        },
      });
    } catch (error) {
      console.error('Erro Prisma ao atualizar prova:', error);
      throw new BadRequestException(this.mensagemErro(error));
    }
  }

  async alterarStatus(id: string, status: StatusProva) {
    return this.atualizar(id, { status });
  }

  async excluir(id: string) {
    try {
      return await this.prisma.prova.delete({ where: { id } });
    } catch (error) {
      console.error('Erro Prisma ao excluir prova:', error);
      throw new BadRequestException(this.mensagemErro(error));
    }
  }

  async adicionarQuestao(
    provaId: string,
    dados: { enunciado: string; tipo?: TipoQuestao },
  ) {
    try {
      const ordem = await this.prisma.questaoProva.count({ where: { provaId } }) + 1;
      return await this.prisma.questaoProva.create({
        data: { provaId, ...dados, ordem },
        include: { alternativas: { orderBy: { ordem: 'asc' } } },
      });
    } catch (error) {
      console.error('Erro Prisma ao adicionar questão à prova:', error);
      throw new BadRequestException(this.mensagemErro(error));
    }
  }

  async adicionarAlternativa(
    provaId: string,
    questaoId: string,
    dados: { texto: string; isCorreta: boolean },
  ) {
    const questao = await this.prisma.questaoProva.findFirst({
      where: { id: questaoId, provaId },
      select: { id: true, _count: { select: { alternativas: true } } },
    });
    if (!questao) throw new NotFoundException('Questão não encontrada nesta prova.');

    try {
      return await this.prisma.alternativaProva.create({
        data: { questaoId, ...dados, ordem: questao._count.alternativas + 1 },
      });
    } catch (error) {
      console.error('Erro Prisma ao adicionar alternativa:', error);
      throw new BadRequestException(this.mensagemErro(error));
    }
  }

  async corrigirRespostas(
    provaId: string,
    respostas: RespostaQuestaoDto[],
    usuarioId?: string,
  ) {
    if (usuarioId) {
      const concluida = await this.prisma.resultadoProva.findUnique({
        where: { usuarioId_provaId: { usuarioId, provaId } },
        select: { id: true },
      });
      if (concluida) throw new ConflictException('Você já concluiu esta avaliação.');
    }

    const prova = await this.prisma.prova.findFirst({
      where: { id: provaId, status: { in: [StatusProva.PUBLICADO, StatusProva.PUBLICADA] } },
      select: {
        questoes: {
          select: {
            id: true,
            tipo: true,
            alternativas: { select: { id: true, texto: true, isCorreta: true } },
          },
        },
      },
    });
    if (!prova) throw new NotFoundException('Prova não encontrada ou não publicada.');

    const respostaPorQuestao = new Map(
      respostas.map((resposta) => [resposta.questaoId, resposta]),
    );
    const resultado = prova.questoes.map((questao) => {
      const resposta = respostaPorQuestao.get(questao.id);
      const alternativaEscolhidaId = resposta?.alternativaId ?? null;
      const alternativaCorreta = questao.alternativas.find((alternativa) => alternativa.isCorreta);
      const alternativaEscolhida = questao.alternativas.find(
        (alternativa) => alternativa.id === alternativaEscolhidaId,
      );

      return {
        questaoId: questao.id,
        tipo: questao.tipo,
        correta: questao.tipo === TipoQuestao.MULTIPLA_ESCOLHA
          && Boolean(alternativaCorreta && alternativaCorreta.id === alternativaEscolhidaId),
        avaliacaoManual: questao.tipo === TipoQuestao.DISSERTATIVA,
        respostaTexto: resposta?.respostaTexto ?? null,
        alternativaEscolhidaId,
        alternativaEscolhidaValida: Boolean(alternativaEscolhida),
        alternativaCorretaId: alternativaCorreta?.id ?? null,
        textoCorreto: alternativaCorreta?.texto ?? null,
      };
    });

    const acertos = resultado.filter((item) => item.correta).length;
    const totalQuestoes = resultado.filter((item) => !item.avaliacaoManual).length;

    return {
      acertos,
      totalQuestoes,
      percentual: totalQuestoes ? Math.round((acertos / totalQuestoes) * 100) : 0,
      resultado,
    };
  }

  async statusDoAluno(provaId: string, usuarioId: string) {
    const prova = await this.prisma.prova.findUnique({
      where: { id: provaId },
      select: { id: true, titulo: true },
    });
    if (!prova) throw new NotFoundException('Prova não encontrada.');

    const resultado = await this.prisma.resultadoProva.findUnique({
      where: { usuarioId_provaId: { usuarioId, provaId } },
      select: { acertos: true, totalQuestoes: true, criadoEm: true },
    });
    return {
      concluida: Boolean(resultado),
      resultado: resultado ? { ...resultado, titulo: prova.titulo } : null,
    };
  }

  async finalizarParaAluno(
    provaId: string,
    usuarioId: string,
    dados: FinalizarProvaDto,
  ) {
    const existente = await this.prisma.resultadoProva.findUnique({
      where: { usuarioId_provaId: { usuarioId, provaId } },
      select: { acertos: true, totalQuestoes: true, criadoEm: true },
    });
    if (existente) {
      const prova = await this.prisma.prova.findUnique({
        where: { id: provaId },
        select: { titulo: true },
      });
      if (!prova) throw new NotFoundException('Prova não encontrada.');
      const percentual = existente.totalQuestoes
        ? Math.round((existente.acertos / existente.totalQuestoes) * 100)
        : 0;
      return {
        ...existente,
        titulo: prova.titulo,
        percentual,
        resultado: [],
        jaConcluida: true,
      };
    }

    const corrigido = await this.corrigirRespostas(provaId, dados.respostas, usuarioId);
    if (dados.acertos !== corrigido.acertos || dados.totalQuestoes !== corrigido.totalQuestoes) {
      throw new BadRequestException('O resultado enviado não corresponde às respostas da avaliação.');
    }

    const [prova, resultado] = await Promise.all([
      this.prisma.prova.findUnique({ where: { id: provaId }, select: { titulo: true } }),
      this.prisma.resultadoProva.upsert({
        where: { usuarioId_provaId: { usuarioId, provaId } },
        update: {},
        create: {
          usuarioId,
          provaId,
          acertos: corrigido.acertos,
          totalQuestoes: corrigido.totalQuestoes,
        },
        select: { acertos: true, totalQuestoes: true, criadoEm: true },
      }),
    ]);
    if (!prova) throw new NotFoundException('Prova não encontrada.');

    return { ...corrigido, ...resultado, titulo: prova.titulo, jaConcluida: false };
  }

  private mensagemErro(error: unknown) {
    return error instanceof Error ? error.message : 'Não foi possível concluir a operação da prova.';
  }
}
