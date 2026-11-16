import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CriarQuizDto } from './dto/criar-quiz.dto';
import { AtualizarQuizDto } from './dto/atualizar-quiz.dto';
import { CriarQuestaoDto } from './dto/criar-questao.dto';
import { CriarAlternativaDto } from './dto/criar-alternativa.dto';
import { ResponderQuizDto } from './dto/responder-quiz.dto';
import { CriarQuestaoCompletaDto } from './dto/criar-questao-completa.dto';

@Injectable()
export class QuizzesService {
  constructor(private readonly prisma: PrismaService) {}

  /*
   * Executa operações relacionadas em uma única transação.
   * Serializable evita que alterações simultâneas deixem
   * publicação, conteúdo e correção inconsistentes.
   */
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

          if (erro.code === 'P2002') {
            throw new ConflictException(
              'Já existe um registro com essa ordem ou identificação.',
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

  private async exigirAula(
    tx: Prisma.TransactionClient,
    aulaId: string,
  ) {
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
    quizId: string,
  ) {
    const quiz = await tx.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz não encontrado.');
    }

    if (quiz.status !== 'RASCUNHO') {
      throw new BadRequestException(
        'Somente quizzes em rascunho podem ser editados.',
      );
    }

    return quiz;
  }

  // ADMINISTRAÇÃO

  criarQuestaoCompleta(quizId: string, dto: CriarQuestaoCompletaDto) {
    return this.executarTransacao(async tx => {
      await this.exigirRascunho(tx, quizId);
      if (await tx.questaoQuiz.count({ where: { quizId } }) >= 100) throw new BadRequestException('Cada quiz pode ter no máximo 100 questões.');
      if (dto.alternativas.length < 2 || dto.alternativas.filter(item => item.correta).length !== 1) throw new BadRequestException('Cadastre pelo menos duas alternativas e exatamente uma correta.');
      return tx.questaoQuiz.create({ data: { quizId, enunciado: dto.enunciado, explicacao: dto.explicacao, ordem: dto.ordem, alternativas: { create: dto.alternativas } }, include: { alternativas: true } });
    });
  }

  voltarRascunho(quizId: string) {
    return this.executarTransacao(async tx => {
      const quiz = await tx.quiz.findUnique({ where: { id: quizId } });
      if (!quiz) throw new NotFoundException('Quiz não encontrado.');
      if (await tx.tentativaQuiz.count({ where: { quizId } })) throw new ConflictException('Este quiz já possui tentativas. Arquive-o para preservar o histórico dos alunos.');
      return tx.quiz.update({ where: { id: quizId }, data: { status: 'RASCUNHO' } });
    });
  }

  editarQuestaoCompleta(quizId: string, questaoId: string, dto: CriarQuestaoCompletaDto) {
    return this.executarTransacao(async tx => {
      await this.exigirRascunho(tx, quizId);
      if (await tx.tentativaQuiz.count({ where: { quizId } })) throw new ConflictException('Não é possível alterar questões com tentativas registradas.');
      const questao = await tx.questaoQuiz.findFirst({ where: { id: questaoId, quizId } });
      if (!questao) throw new NotFoundException('Questão não encontrada neste quiz.');
      if (dto.alternativas.length < 2 || dto.alternativas.filter(item => item.correta).length !== 1) throw new BadRequestException('Cadastre pelo menos duas alternativas e exatamente uma correta.');
      await tx.alternativaQuiz.deleteMany({ where: { questaoId } });
      return tx.questaoQuiz.update({ where: { id: questaoId }, data: { enunciado: dto.enunciado, explicacao: dto.explicacao, ordem: dto.ordem, alternativas: { create: dto.alternativas } }, include: { alternativas: true } });
    });
  }

  excluirQuestao(quizId: string, questaoId: string) {
    return this.executarTransacao(async tx => {
      await this.exigirRascunho(tx, quizId);
      if (await tx.tentativaQuiz.count({ where: { quizId } })) throw new ConflictException('Não é possível excluir questões com tentativas registradas.');
      if (!await tx.questaoQuiz.findFirst({ where: { id: questaoId, quizId } })) throw new NotFoundException('Questão não encontrada neste quiz.');
      await tx.alternativaQuiz.deleteMany({ where: { questaoId } });
      return tx.questaoQuiz.delete({ where: { id: questaoId } });
    });
  }

  excluirQuiz(quizId: string) {
    return this.executarTransacao(async tx => {
      const quiz = await tx.quiz.findUnique({ where: { id: quizId } });
      if (!quiz) throw new NotFoundException('Quiz não encontrado.');
      if (await tx.tentativaQuiz.count({ where: { quizId } })) throw new ConflictException('Este quiz possui resultados de alunos. Arquive-o em vez de excluir.');
      await tx.alternativaQuiz.deleteMany({ where: { questao: { quizId } } });
      await tx.questaoQuiz.deleteMany({ where: { quizId } });
      return tx.quiz.delete({ where: { id: quizId } });
    });
  }

  listarQuizzesAdmin() {
    return this.prisma.quiz.findMany({
      orderBy: { criadoEm: 'desc' },
      include: {
        aula: {
          select: { id: true, titulo: true },
        },
        questoes: {
          orderBy: { ordem: 'asc' },
          include: {
            alternativas: {
              orderBy: { ordem: 'asc' },
            },
          },
        },
      },
    });
  }

  criarQuiz(dto: CriarQuizDto) {
    return this.executarTransacao(async (tx) => {
      await this.exigirAula(tx, dto.aulaId);

      return tx.quiz.create({
        data: {
          titulo: dto.titulo,
          descricao: dto.descricao,
          aulaId: dto.aulaId,
        },
      });
    });
  }

  atualizarQuiz(quizId: string, dto: AtualizarQuizDto) {
    return this.executarTransacao(async (tx) => {
      await this.exigirRascunho(tx, quizId);

      if (
        dto.titulo === undefined &&
        dto.descricao === undefined &&
        dto.aulaId === undefined
      ) {
        throw new BadRequestException(
          'Informe pelo menos um campo para atualizar.',
        );
      }

      if (dto.aulaId !== undefined) {
        await this.exigirAula(tx, dto.aulaId);
      }

      return tx.quiz.update({
        where: { id: quizId },
        data: {
          titulo: dto.titulo,
          descricao: dto.descricao,
          aulaId: dto.aulaId,
        },
      });
    });
  }

  criarQuestao(quizId: string, dto: CriarQuestaoDto) {
    return this.executarTransacao(async (tx) => {
      await this.exigirRascunho(tx, quizId);

      const quantidade = await tx.questaoQuiz.count({
        where: { quizId },
      });

      if (quantidade >= 100) {
        throw new BadRequestException(
          'Cada quiz pode ter no máximo 100 questões.',
        );
      }

      return tx.questaoQuiz.create({
        data: {
          quizId,
          enunciado: dto.enunciado,
          explicacao: dto.explicacao,
          ordem: dto.ordem,
        },
      });
    });
  }

  criarAlternativa(
    quizId: string,
    questaoId: string,
    dto: CriarAlternativaDto,
  ) {
    return this.executarTransacao(async (tx) => {
      await this.exigirRascunho(tx, quizId);

      const questao = await tx.questaoQuiz.findFirst({
        where: {
          id: questaoId,
          quizId,
        },
        select: { id: true },
      });

      if (!questao) {
        throw new NotFoundException(
          'Questão não encontrada neste quiz.',
        );
      }

      return tx.alternativaQuiz.create({
        data: {
          questaoId,
          texto: dto.texto,
          correta: dto.correta,
          ordem: dto.ordem,
        },
      });
    });
  }

  publicarQuiz(quizId: string) {
    return this.executarTransacao(async (tx) => {
      await this.exigirRascunho(tx, quizId);

      const questoes = await tx.questaoQuiz.findMany({
        where: { quizId },
        include: { alternativas: true },
      });

      if (questoes.length === 0) {
        throw new BadRequestException(
          'Cadastre pelo menos uma questão antes de publicar.',
        );
      }

      for (const questao of questoes) {
        if (questao.alternativas.length < 2) {
          throw new BadRequestException(
            `A questão ${questao.ordem} precisa de pelo menos duas alternativas.`,
          );
        }

        const corretas = questao.alternativas.filter(
          (alternativa) => alternativa.correta,
        );

        if (corretas.length !== 1) {
          throw new BadRequestException(
            `A questão ${questao.ordem} precisa ter exatamente uma alternativa correta.`,
          );
        }
      }

      return tx.quiz.update({
        where: { id: quizId },
        data: { status: 'PUBLICADO' },
      });
    });
  }

  arquivarQuiz(quizId: string) {
    return this.executarTransacao(async (tx) => {
      const quiz = await tx.quiz.findUnique({
        where: { id: quizId },
      });

      if (!quiz) {
        throw new NotFoundException('Quiz não encontrado.');
      }

      return tx.quiz.update({
        where: { id: quizId },
        data: { status: 'ARQUIVADO' },
      });
    });
  }

  // CONSULTA DO ALUNO

  async listarQuizzes(aulaId?: string, usuarioId?: string) {
    const quizzes = await this.prisma.quiz.findMany({
      where: {
        status: 'PUBLICADO',
        ...(aulaId ? { aulaId } : {}),
      },
      orderBy: { criadoEm: 'desc' },
      select: {
        tentativas: { where: { usuarioId: usuarioId ?? '' }, orderBy: { concluidoEm: 'desc' }, take: 1, select: { id: true, totalAcertos: true, totalQuestoes: true } },
        id: true,
        titulo: true,
        descricao: true,
        aulaId: true,
        aula: {
          select: { id: true, titulo: true },
        },
        _count: {
          select: { questoes: true },
        },
      },
    });
    return quizzes.map(quiz => ({ ...quiz, tentativas: quiz.tentativas.filter(tentativa => tentativa.totalQuestoes === quiz._count.questoes) }));
  }

  async buscarQuiz(quizId: string, usuarioId?: string) {
    const quiz = await this.prisma.quiz.findFirst({
      where: {
        id: quizId,
        status: 'PUBLICADO',
      },
      select: {
        tentativas: { where: { usuarioId: usuarioId ?? '' }, orderBy: { concluidoEm: 'desc' }, take: 1, select: { id: true, totalAcertos: true, totalQuestoes: true } },
        id: true,
        titulo: true,
        descricao: true,
        aulaId: true,
        aula: {
          select: { id: true, titulo: true },
        },
        questoes: {
          orderBy: { ordem: 'asc' },
          select: {
            id: true,
            enunciado: true,
            ordem: true,
            alternativas: {
              orderBy: { ordem: 'asc' },
              select: {
                id: true,
                texto: true,
                ordem: true,
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz não encontrado.');
    }

    const salvo = await this.resultadoDoAluno(quizId, usuarioId);
    const atuais = new Set(quiz.questoes.map(questao => questao.id));
    const corresponde = salvo && salvo.totalQuestoes === atuais.size && salvo.feedback.length === atuais.size && salvo.feedback.every(item => atuais.has(item.questaoId));
    return { ...quiz, resultado: corresponde ? salvo : null, resultadoAnterior: salvo && !corresponde ? salvo : null };
  }

  // CORREÇÃO E REGISTRO DA TENTATIVA

  responderQuiz(
    usuarioId: string,
    quizId: string,
    dto: ResponderQuizDto,
  ) {
    return this.executarTransacao(async (tx) => {
      const concluida = await tx.tentativaQuiz.findFirst({ where: { usuarioId, quizId }, orderBy: { concluidoEm: 'desc' },
        select: { id: true, totalQuestoes: true, respostas: { select: { questaoId: true } } } });
      const quiz = await tx.quiz.findFirst({
        where: {
          id: quizId,
          status: 'PUBLICADO',
        },
        include: {
          questoes: {
            orderBy: { ordem: 'asc' },
            include: { alternativas: true },
          },
        },
      });

      if (!quiz) {
        throw new NotFoundException('Quiz não encontrado.');
      }

      if (quiz.questoes.length === 0) {
        throw new BadRequestException(
          'Este quiz não possui questões disponíveis.',
        );
      }

      if (concluida) {
        const atuais = new Set(quiz.questoes.map(questao => questao.id));
        // Permitir a versão ampliada sem apagar ou alterar o resultado antigo.
        const ampliado = concluida.totalQuestoes > 0 && concluida.totalQuestoes < atuais.size &&
          concluida.respostas.length === concluida.totalQuestoes && concluida.respostas.every(item => atuais.has(item.questaoId));
        if (!ampliado) throw new ConflictException('Atividade já concluída. Consulte seu resultado.');
      }

      const respostasPorQuestao = new Map(
        dto.respostas.map((resposta) => [
          resposta.questaoId,
          resposta.alternativaId,
        ]),
      );

      if (
        dto.respostas.length !== quiz.questoes.length ||
        respostasPorQuestao.size !== quiz.questoes.length
      ) {
        throw new BadRequestException(
          'Responda todas as questões uma única vez.',
        );
      }

      const feedback = quiz.questoes.map((questao) => {
        const alternativaId = respostasPorQuestao.get(questao.id);

        const alternativa = questao.alternativas.find(
          (item) => item.id === alternativaId,
        );

        if (!alternativa) {
          throw new BadRequestException(
            `Selecione uma alternativa válida para a questão ${questao.ordem}.`,
          );
        }

        const corretas = questao.alternativas.filter(
          (item) => item.correta,
        );

        if (corretas.length !== 1) {
          throw new ConflictException(
            'O quiz possui uma questão com gabarito inválido.',
          );
        }

        return {
          questaoId: questao.id,
          alternativaId: alternativa.id,
          alternativaCorretaId: corretas[0].id,
          acertou: alternativa.correta,
          explicacao: questao.explicacao,
        };
      });

      const totalAcertos = feedback.filter(
        (resposta) => resposta.acertou,
      ).length;

      const tentativa = await tx.tentativaQuiz.create({
        data: {
          usuarioId,
          quizId,
          totalQuestoes: quiz.questoes.length,
          totalAcertos,
          respostas: {
            create: feedback.map((resposta) => ({
              questaoId: resposta.questaoId,
              alternativaId: resposta.alternativaId,
              acertou: resposta.acertou,
            })),
          },
        },
      });

      return {
        tentativaId: tentativa.id,
        quizId,
        totalQuestoes: tentativa.totalQuestoes,
        totalAcertos: tentativa.totalAcertos,
        concluido: true,
        progressoAtualizado: false,
        feedback,
      };
    });
  }
  async resultadoDoAluno(quizId: string, usuarioId?: string) {
    if (!usuarioId) return null;
    const t = await this.prisma.tentativaQuiz.findFirst({
      where: { usuarioId, quizId }, orderBy: { concluidoEm: 'desc' },
      include: { respostas: { include: { questao: { include: { alternativas: true } } } } },
    });
    if (!t) return null;
    return { tentativaId: t.id, quizId, totalQuestoes: t.totalQuestoes, totalAcertos: t.totalAcertos,
      concluido: true, progressoAtualizado: false,
      feedback: t.respostas.map(r => ({ questaoId: r.questaoId, alternativaId: r.alternativaId,
        alternativaCorretaId: r.questao.alternativas.find(a => a.correta)?.id ?? '',
        acertou: r.acertou, explicacao: r.questao.explicacao })),
    };
  }

}
