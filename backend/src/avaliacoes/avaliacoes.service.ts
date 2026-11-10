import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CorrecaoProvaService,
  GabaritoQuestao,
  RespostaEnviada,
} from './correcao-prova.service';

@Injectable()
export class AvaliacoesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly correcao: CorrecaoProvaService,
  ) {}

  // Monta o gabarito a partir do banco e persiste tentativa + respostas numa transacao.
  async salvarTentativaProva(
    usuarioId: string,
    provaId: string,
    respostasEnviadas: RespostaEnviada[],
  ) {
    const questoes = await this.prisma.questaoProva.findMany({
      where: { provaId },
      select: {
        id: true,
        enunciado: true,
        explicacao: true,
        alternativas: { select: { id: true, texto: true, isCorreta: true } },
      },
    });

    if (questoes.length === 0) {
      throw new NotFoundException('Esta prova ainda nao possui questoes.');
    }

    const gabarito: GabaritoQuestao[] = questoes.map(
      (questao: {
        id: string;
        alternativas: { id: string; isCorreta: boolean }[];
      }) => ({
        questaoId: questao.id,
        alternativasValidas: new Set(
          questao.alternativas.map((a: { id: string }) => a.id),
        ),
        alternativaCorretaId:
          questao.alternativas.find((a: { isCorreta: boolean }) => a.isCorreta)
            ?.id ?? null,
      }),
    );

    const resultado = this.correcao.corrigirProva(respostasEnviadas, gabarito);
    const concluidoEm = new Date();

    const tentativa = await this.prisma.$transaction(async (tx) => {
      // Serializa envios da mesma conta/prova, inclusive em abas diferentes.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${usuarioId}), hashtext(${provaId}))`;
      const existente = await tx.tentativaProva.findFirst({
        where: { usuarioId, provaId, concluidoEm: { not: null } },
        select: { id: true },
      });
      const legado = await tx.resultadoProva.findUnique({
        where: { usuarioId_provaId: { usuarioId, provaId } }, select: { id: true },
      });
      if (existente || legado) {
        throw new ConflictException('Você já concluiu esta avaliação. Consulte seu resultado.');
      }
      const criada = await tx.tentativaProva.create({
        data: {
          usuarioId,
          provaId,
          nota: resultado.nota,
          totalQuestoes: resultado.totalQuestoes,
          totalAcertos: resultado.totalAcertos,
          concluidoEm,
        },
      });

      await tx.respostaProva.createMany({
        data: resultado.respostas.map((resposta) => ({
          tentativaId: criada.id,
          questaoId: resposta.questaoId,
          alternativaId: resposta.alternativaId,
          acertou: resposta.acertou,
        })),
      });

      // Mantém o status consistente também nas rotas antigas e no painel administrativo.
      await tx.resultadoProva.upsert({
        where: { usuarioId_provaId: { usuarioId, provaId } }, update: {},
        create: { usuarioId, provaId, acertos: resultado.totalAcertos, totalQuestoes: resultado.totalQuestoes },
      });

      return criada;
    });

    return {
      tentativaId: tentativa.id,
      provaId,
      nota: resultado.nota,
      totalQuestoes: resultado.totalQuestoes,
      totalAcertos: resultado.totalAcertos,
      concluido: true,
      feedback: questoes.map((questao) => ({
        questaoId: questao.id,
        enunciado: questao.enunciado,
        explicacao: questao.explicacao,
        correta: resultado.respostas.find((resposta) => resposta.questaoId === questao.id)?.acertou ?? false,
        respostaCorreta: questao.alternativas.find((alternativa) => alternativa.isCorreta)?.texto ?? '',
      })),
    };
  }

  async buscarResultadoProva(tentativaId: string, usuarioId: string) {
    const tentativa = await this.prisma.tentativaProva.findUnique({
      where: { id: tentativaId },
      include: {
        prova: { select: { id: true, titulo: true } },
        respostas: {
          select: {
            questaoId: true, alternativaId: true, acertou: true,
            questao: { select: {
              enunciado: true, explicacao: true,
              alternativas: { where: { isCorreta: true }, select: { texto: true } },
            } },
          },
        },
      },
    });

    if (!tentativa || tentativa.usuarioId !== usuarioId) {
      throw new NotFoundException('Tentativa nao encontrada.');
    }

    return {
      tentativaId: tentativa.id,
      provaId: tentativa.provaId,
      provaTitulo: tentativa.prova.titulo,
      nota: tentativa.nota,
      totalQuestoes: tentativa.totalQuestoes,
      totalAcertos: tentativa.totalAcertos,
      concluido: tentativa.concluidoEm !== null,
      concluidoEm: tentativa.concluidoEm,
      respostas: tentativa.respostas,
      feedback: tentativa.respostas.map((resposta) => ({
        questaoId: resposta.questaoId,
        enunciado: resposta.questao.enunciado,
        explicacao: resposta.questao.explicacao,
        correta: resposta.acertou,
        respostaCorreta: resposta.questao.alternativas[0]?.texto ?? '',
      })),
    };
  }

  async listarMinhasTentativas(usuarioId: string) {
    const tentativas = await this.prisma.tentativaProva.findMany({
      where: { usuarioId },
      orderBy: { concluidoEm: 'desc' },
      include: { prova: { select: { id: true, titulo: true } } },
    });

    return tentativas.map(
      (t: {
        id: string;
        provaId: string;
        prova: { titulo: string };
        nota: number;
        totalQuestoes: number;
        totalAcertos: number;
        concluidoEm: Date | null;
      }) => ({
        tentativaId: t.id,
        provaId: t.provaId,
        provaTitulo: t.prova.titulo,
        nota: t.nota,
        totalQuestoes: t.totalQuestoes,
        totalAcertos: t.totalAcertos,
        concluidoEm: t.concluidoEm,
      }),
    );
  }
}
