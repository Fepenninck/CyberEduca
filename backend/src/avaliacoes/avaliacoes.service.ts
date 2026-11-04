import { Injectable, NotFoundException } from '@nestjs/common';
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
        alternativas: { select: { id: true, correta: true } },
      },
    });

    if (questoes.length === 0) {
      throw new NotFoundException('Esta prova ainda nao possui questoes.');
    }

    const gabarito: GabaritoQuestao[] = questoes.map(
      (questao: {
        id: string;
        alternativas: { id: string; correta: boolean }[];
      }) => ({
        questaoId: questao.id,
        alternativasValidas: new Set(
          questao.alternativas.map((a: { id: string }) => a.id),
        ),
        alternativaCorretaId:
          questao.alternativas.find((a: { correta: boolean }) => a.correta)
            ?.id ?? null,
      }),
    );

    const resultado = this.correcao.corrigirProva(respostasEnviadas, gabarito);
    const concluidoEm = new Date();

    const tentativa = await this.prisma.$transaction(async (tx) => {
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

      return criada;
    });

    return {
      tentativaId: tentativa.id,
      provaId,
      nota: resultado.nota,
      totalQuestoes: resultado.totalQuestoes,
      totalAcertos: resultado.totalAcertos,
      concluido: true,
    };
  }

  async buscarResultadoProva(tentativaId: string, usuarioId: string) {
    const tentativa = await this.prisma.tentativaProva.findUnique({
      where: { id: tentativaId },
      include: {
        prova: { select: { id: true, titulo: true } },
        respostas: {
          select: { questaoId: true, alternativaId: true, acertou: true },
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
