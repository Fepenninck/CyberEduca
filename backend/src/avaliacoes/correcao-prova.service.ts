import { BadRequestException, Injectable } from '@nestjs/common';

export type GabaritoQuestao = {
  questaoId: string;
  alternativasValidas: Set<string>;
  alternativaCorretaId: string | null;
};

export type RespostaEnviada = {
  questaoId: string;
  alternativaId: string;
};

export type RespostaCorrigida = RespostaEnviada & { acertou: boolean };

export type ResultadoCorrecao = {
  respostas: RespostaCorrigida[];
  totalQuestoes: number;
  totalAcertos: number;
  nota: number;
};

@Injectable()
export class CorrecaoProvaService {
  // Compara as respostas enviadas com o gabarito vindo do banco.
  // O gabarito nunca chega pelo frontend: ele e montado no AvaliacoesService.
  corrigirProva(
    respostas: RespostaEnviada[],
    gabarito: GabaritoQuestao[],
  ): ResultadoCorrecao {
    const porQuestao = new Map(gabarito.map((g) => [g.questaoId, g]));
    const jaRespondidas = new Set<string>();
    const corrigidas: RespostaCorrigida[] = [];

    for (const resposta of respostas) {
      const questao = porQuestao.get(resposta.questaoId);

      if (!questao) {
        throw new BadRequestException(
          'Uma das questoes enviadas nao pertence a esta prova.',
        );
      }

      if (!questao.alternativasValidas.has(resposta.alternativaId)) {
        throw new BadRequestException(
          'Uma das alternativas enviadas nao pertence a questao informada.',
        );
      }

      if (jaRespondidas.has(resposta.questaoId)) {
        throw new BadRequestException(
          'Ha mais de uma resposta para a mesma questao.',
        );
      }

      jaRespondidas.add(resposta.questaoId);

      corrigidas.push({
        questaoId: resposta.questaoId,
        alternativaId: resposta.alternativaId,
        acertou: questao.alternativaCorretaId === resposta.alternativaId,
      });
    }

    const totalQuestoes = gabarito.length;
    const totalAcertos = corrigidas.filter((r) => r.acertou).length;

    return {
      respostas: corrigidas,
      totalQuestoes,
      totalAcertos,
      nota: this.calcularNota(totalAcertos, totalQuestoes),
    };
  }

  // Nota de 0 a 10, com uma casa decimal.
  calcularNota(totalAcertos: number, totalQuestoes: number): number {
    if (totalQuestoes === 0) return 0;
    return Math.round((totalAcertos / totalQuestoes) * 100) / 10;
  }
}
