import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CorrecaoProvaService } from './correcao-prova.service';

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
    respostasEnviadas: Array<{
      questaoId: string;
      alternativaId?: string;
      respostaTexto?: string;
    }>,
  ) {
    const tentativa = await this.prisma.$transaction(async (tx) => {
      const prova = await tx.prova.findFirst({
        where: { id: provaId, status: { in: ['PUBLICADA', 'PUBLICADO'] } },
        include: { questoes: { include: { alternativas: true } } },
      });
      if (!prova || !prova.questoes.length)
        throw new NotFoundException('Prova publicada não encontrada.');
      const porId = new Map(
        respostasEnviadas.map((item) => [item.questaoId, item]),
      );
      if (
        porId.size !== respostasEnviadas.length ||
        porId.size !== prova.questoes.length ||
        prova.questoes.some((q) => !porId.has(q.id))
      )
        throw new BadRequestException(
          'Responda todas as questões uma única vez.',
        );
      const objetivas = prova.questoes.filter((q) => q.tipo !== 'DISSERTATIVA');
      if (
        objetivas.some(
          (q) => q.alternativas.filter((a) => a.isCorreta).length !== 1,
        )
      )
        throw new BadRequestException('A prova possui um gabarito inválido.');
      const resultado = this.correcao.corrigirProva(
        respostasEnviadas
          .filter((item) => objetivas.some((q) => q.id === item.questaoId))
          .map((item) => {
            if (!item.alternativaId || item.respostaTexto !== undefined)
              throw new BadRequestException(
                'Selecione uma alternativa válida.',
              );
            return {
              questaoId: item.questaoId,
              alternativaId: item.alternativaId,
            };
          }),
        objetivas.map((q) => ({
          questaoId: q.id,
          alternativasValidas: new Set(q.alternativas.map((a) => a.id)),
          alternativaCorretaId:
            q.alternativas.find((a) => a.isCorreta)?.id ?? null,
        })),
      );
      const dissertativas = prova.questoes
        .filter((q) => q.tipo === 'DISSERTATIVA')
        .map((q) => {
          const resposta = porId.get(q.id)!;
          if (!resposta.respostaTexto?.trim() || resposta.alternativaId)
            throw new BadRequestException('Preencha a resposta dissertativa.');
          return {
            questaoId: q.id,
            alternativaId: null,
            respostaTexto: resposta.respostaTexto.trim(),
            acertou: false,
            avaliacaoManual: true,
          };
        });
      return tx.tentativaProva.create({
        data: {
          usuarioId,
          provaId,
          nota: resultado.nota,
          totalQuestoes: resultado.totalQuestoes,
          totalAcertos: resultado.totalAcertos,
          concluidoEm: new Date(),
          respostas: { create: [...resultado.respostas, ...dissertativas] },
        },
      });
    });
    const totalPendentes = await this.prisma.respostaProva.count({
      where: { tentativaId: tentativa.id, avaliacaoManual: true },
    });
    return {
      tentativaId: tentativa.id,
      provaId,
      nota: tentativa.nota,
      totalQuestoes: tentativa.totalQuestoes,
      totalAcertos: tentativa.totalAcertos,
      totalPendentes,
      concluido: true,
    };
  }

  async buscarResultadoProva(tentativaId: string, usuarioId: string) {
    const tentativa = await this.prisma.tentativaProva.findUnique({
      where: { id: tentativaId },
      include: {
        prova: { select: { id: true, titulo: true } },
        respostas: {
          select: {
            questaoId: true,
            alternativaId: true,
            respostaTexto: true,
            avaliacaoManual: true,
            acertou: true,
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
