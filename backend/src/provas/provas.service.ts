import { RespostaQuestaoDto } from './dto/responder-prova.dto';
import { FinalizarProvaDto } from './dto/finalizar-prova.dto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AcaoAuditoria, StatusProva, TipoQuestao } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { AuditoriaService } from '../auditoria.service';
import { AvaliacoesService } from '../avaliacoes/avaliacoes.service';
import { CriarProvaDto } from './dto/criar-prova.dto';
import { AtualizarProvaDto } from './dto/atualizar-prova.dto';
import { CriarQuestaoProvaDto } from './dto/criar-questao-prova.dto';
import { CriarAlternativaProvaDto } from './dto/criar-alternativa-prova.dto';
import { EnviarTentativaProvaDto } from './dto/enviar-tentativa-prova.dto';

type AlternativaPublica = {
  id: string;
  texto: string;
  ordem: number;
};

type QuestaoPublica = {
  id: string;
  enunciado: string;
  ordem: number;
  alternativas: AlternativaPublica[];
};

@Injectable()
export class ProvasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly avaliacoes: AvaliacoesService,
  ) {}

  // ---------- Administracao ----------

  async criarProva(dados: CriarProvaDto, atorId: string) {
    const trilha = await this.prisma.trilha.findUnique({
      where: { id: dados.trilhaId },
    });

    if (!trilha) {
      throw new NotFoundException('Trilha nao encontrada.');
    }

    const prova = await this.prisma.prova.create({
      data: {
        titulo: dados.titulo,
        descricao: dados.descricao ?? '',
        trilhaId: dados.trilhaId,
      },
    });

    await this.auditoria.registrar({
      acao: AcaoAuditoria.CRIAR,
      entidade: 'Prova',
      entidadeId: prova.id,
      atorId,
      dadosNovos: { titulo: prova.titulo, trilhaId: prova.trilhaId },
    });

    return prova;
  }

  async atualizarProva(
    provaId: string,
    dados: AtualizarProvaDto,
    atorId: string,
  ) {
    const anterior = await this.prisma.prova.findUnique({
      where: { id: provaId },
    });

    if (!anterior) {
      throw new NotFoundException('Prova nao encontrada.');
    }

    const prova = await this.prisma.prova.update({
      where: { id: provaId },
      data: dados,
    });

    await this.auditoria.registrar({
      acao: AcaoAuditoria.ATUALIZAR,
      entidade: 'Prova',
      entidadeId: provaId,
      atorId,
      dadosAnteriores: { titulo: anterior.titulo, status: anterior.status },
      dadosNovos: { titulo: prova.titulo, status: prova.status },
    });

    return prova;
  }

  async listarProvasAdmin() {
    const provas = await this.prisma.prova.findMany({
      orderBy: { criadoEm: 'desc' },
      include: {
        trilha: { select: { id: true, titulo: true } },
        _count: { select: { questoes: true, tentativas: true } },
      },
    });

    return provas.map(
      (p: {
        id: string;
        titulo: string;
        descricao: string;
        status: StatusProva;
        criadoEm: Date;
        trilha: { id: string; titulo: string };
        _count: { questoes: number; tentativas: number };
      }) => ({
        id: p.id,
        titulo: p.titulo,
        descricao: p.descricao,
        status: p.status,
        criadoEm: p.criadoEm,
        trilha: p.trilha,
        totalQuestoes: p._count.questoes,
        totalTentativas: p._count.tentativas,
      }),
    );
  }

  async criarQuestao(
    provaId: string,
    dados: CriarQuestaoProvaDto,
    atorId: string,
  ) {
    await this.garantirProvaExiste(provaId);

    const ordemOcupada = await this.prisma.questaoProva.findFirst({
      where: { provaId, ordem: dados.ordem },
      select: { id: true },
    });

    if (ordemOcupada) {
      throw new BadRequestException(
        `Ja existe uma questao na ordem ${dados.ordem} nesta prova.`,
      );
    }

    const questao = await this.prisma.questaoProva.create({
      data: { provaId, enunciado: dados.enunciado, ordem: dados.ordem },
    });

    await this.auditoria.registrar({
      acao: AcaoAuditoria.CRIAR,
      entidade: 'QuestaoProva',
      entidadeId: questao.id,
      atorId,
      dadosNovos: { provaId, ordem: questao.ordem },
    });

    return questao;
  }

  async criarAlternativa(
    provaId: string,
    questaoId: string,
    dados: CriarAlternativaProvaDto,
    atorId: string,
  ) {
    const questao = await this.prisma.questaoProva.findUnique({
      where: { id: questaoId },
      include: { alternativas: { select: { id: true, isCorreta: true, ordem: true } } },
    });

    if (!questao || questao.provaId !== provaId) {
      throw new NotFoundException('Questao nao encontrada nesta prova.');
    }

    if (questao.alternativas.some((a: { ordem: number }) => a.ordem === dados.ordem)) {
      throw new BadRequestException(
        `Ja existe uma alternativa na ordem ${dados.ordem} nesta questao.`,
      );
    }

    const jaTemCorreta = questao.alternativas.some(
      (a: { isCorreta: boolean }) => a.isCorreta,
    );

    if (dados.correta && jaTemCorreta) {
      throw new BadRequestException(
        'Esta questao ja possui uma alternativa isCorreta.',
      );
    }

    const alternativa = await this.prisma.alternativaProva.create({
      data: {
        questaoId,
        texto: dados.texto,
        isCorreta: dados.correta ?? false,
        ordem: dados.ordem,
      },
    });

    await this.auditoria.registrar({
      acao: AcaoAuditoria.CRIAR,
      entidade: 'AlternativaProva',
      entidadeId: alternativa.id,
      atorId,
      dadosNovos: { questaoId, ordem: alternativa.ordem },
    });

    return alternativa;
  }

  // Publicar exige que toda questao tenha ao menos duas alternativas e uma isCorreta.
  async publicarProva(provaId: string, atorId: string) {
    const prova = await this.prisma.prova.findUnique({
      where: { id: provaId },
      include: {
        questoes: {
          include: { alternativas: { select: { isCorreta: true } } },
        },
      },
    });

    if (!prova) {
      throw new NotFoundException('Prova nao encontrada.');
    }

    if (prova.questoes.length === 0) {
      throw new BadRequestException(
        'Adicione pelo menos uma questao antes de publicar.',
      );
    }

    const invalida = prova.questoes.find(
      (q: { alternativas: { isCorreta: boolean }[] }) =>
        q.alternativas.length < 2 ||
        !q.alternativas.some((a: { isCorreta: boolean }) => a.isCorreta),
    );

    if (invalida) {
      throw new BadRequestException(
        'Cada questao precisa de pelo menos duas alternativas e uma isCorreta.',
      );
    }

    return this.alterarStatusProva(provaId, StatusProva.PUBLICADA, atorId);
  }

  async arquivarProva(provaId: string, atorId: string) {
    await this.garantirProvaExiste(provaId);
    return this.alterarStatusProva(provaId, StatusProva.ARQUIVADA, atorId);
  }

  async alterarStatusProva(
    provaId: string,
    status: StatusProva,
    atorId: string,
  ) {
    const prova = await this.prisma.prova.update({
      where: { id: provaId },
      data: { status },
    });

    await this.auditoria.registrar({
      acao: AcaoAuditoria.ATUALIZAR,
      entidade: 'Prova',
      entidadeId: provaId,
      atorId,
      dadosNovos: { status },
    });

    return prova;
  }

  // ---------- Consulta do aluno ----------

  async listarProvas(trilhaId?: string) {
    const provas = await this.prisma.prova.findMany({
      where: {
        status: { in: [StatusProva.PUBLICADA, StatusProva.PUBLICADO] },
        ...(trilhaId ? { trilhaId } : {}),
      },
      orderBy: { criadoEm: 'desc' },
      include: {
        trilha: { select: { id: true, titulo: true, nivel: true } },
        _count: { select: { questoes: true } },
      },
    });

    return provas.map(
      (p: {
        id: string;
        titulo: string;
        descricao: string;
        trilha: { id: string; titulo: string; nivel: string };
        _count: { questoes: number };
      }) => ({
        id: p.id,
        titulo: p.titulo,
        descricao: p.descricao,
        trilha: p.trilha,
        totalQuestoes: p._count.questoes,
      }),
    );
  }

  // Nunca retorna o campo "isCorreta": o gabarito so existe no backend.
  async buscarProva(provaId: string) {
    const prova = await this.prisma.prova.findUnique({
      where: { id: provaId },
      include: {
        trilha: { select: { id: true, titulo: true, nivel: true } },
        questoes: {
          orderBy: { ordem: 'asc' },
          include: {
            alternativas: {
              orderBy: { ordem: 'asc' },
              select: { id: true, texto: true, ordem: true },
            },
          },
        },
      },
    });

    if (!prova) {
      throw new NotFoundException('Prova nao encontrada.');
    }

    if (prova.status !== StatusProva.PUBLICADA && prova.status !== StatusProva.PUBLICADO) {
      throw new ForbiddenException('Esta prova nao esta disponivel.');
    }

    return {
      id: prova.id,
      titulo: prova.titulo,
      descricao: prova.descricao,
      trilha: prova.trilha,
      totalQuestoes: prova.questoes.length,
      questoes: prova.questoes.map(
        (q: QuestaoPublica): QuestaoPublica => ({
          id: q.id,
          enunciado: q.enunciado,
          ordem: q.ordem,
          alternativas: q.alternativas,
        }),
      ),
    };
  }

  // ---------- Envio da tentativa (Funcionalidade 2) ----------

  async enviarTentativa(
    provaId: string,
    usuarioId: string,
    dados: EnviarTentativaProvaDto,
  ) {
    const prova = await this.prisma.prova.findUnique({
      where: { id: provaId },
      select: { id: true, status: true },
    });

    if (!prova) {
      throw new NotFoundException('Prova nao encontrada.');
    }

    if (prova.status !== StatusProva.PUBLICADA && prova.status !== StatusProva.PUBLICADO) {
      throw new ForbiddenException('Esta prova nao esta disponivel.');
    }

    const resultado = await this.avaliacoes.salvarTentativaProva(
      usuarioId,
      provaId,
      dados.respostas,
    );

    await this.auditoria.registrar({
      acao: AcaoAuditoria.CRIAR,
      entidade: 'TentativaProva',
      entidadeId: resultado.tentativaId,
      atorId: usuarioId,
      dadosNovos: {
        provaId,
        nota: resultado.nota,
        totalAcertos: resultado.totalAcertos,
      },
    });

    return resultado;
  }

  private async garantirProvaExiste(provaId: string) {
    const prova = await this.prisma.prova.findUnique({
      where: { id: provaId },
      select: { id: true },
    });

    if (!prova) {
      throw new NotFoundException('Prova nao encontrada.');
    }

    return prova;
  }
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
      const tentativa = await this.prisma.tentativaProva.findFirst({
        where: { usuarioId, provaId, concluidoEm: { not: null } }, select: { id: true },
      });
      if (tentativa) throw new ConflictException('Você já concluiu esta avaliação.');
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
    const tentativa = !resultado ? await this.prisma.tentativaProva.findFirst({
      where: { usuarioId, provaId, concluidoEm: { not: null } },
      orderBy: { concluidoEm: 'desc' },
    }) : null;
    const salvo = resultado ?? (tentativa ? {
      acertos: tentativa.totalAcertos, totalQuestoes: tentativa.totalQuestoes, criadoEm: tentativa.concluidoEm,
    } : null);
    return { concluida: Boolean(salvo), resultado: salvo ? { ...salvo, titulo: prova.titulo } : null };
  }

  async finalizarParaAluno(
    provaId: string,
    usuarioId: string,
    dados: FinalizarProvaDto,
  ) {
    const tentativa = await this.prisma.tentativaProva.findFirst({
      where: { usuarioId, provaId, concluidoEm: { not: null } }, orderBy: { concluidoEm: 'desc' },
    });
    if (tentativa) {
      const prova = await this.prisma.prova.findUnique({ where: { id: provaId }, select: { titulo: true } });
      if (!prova) throw new NotFoundException('Prova não encontrada.');
      return { acertos: tentativa.totalAcertos, totalQuestoes: tentativa.totalQuestoes,
        criadoEm: tentativa.concluidoEm, titulo: prova.titulo,
        percentual: tentativa.totalQuestoes ? Math.round(tentativa.totalAcertos / tentativa.totalQuestoes * 100) : 0,
        resultado: [], jaConcluida: true };
    }
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
