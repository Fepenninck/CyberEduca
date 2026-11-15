import { describe, expect, it, jest } from '@jest/globals';
import { UsuariosService } from './usuarios.service';
import type { PrismaService } from '../prisma.service';

describe('Desempenho pessoal sem comparação entre alunos', () => {
  it('agrupa simulações por atividade e resume avaliações sem duplicar resultados legados', async () => {
    const lista = (dados: any[] = []) => ({ findMany: jest.fn<(...args: any[]) => Promise<any[]>>().mockResolvedValue(dados) });
    const prisma = {
      quiz: { count: jest.fn<(...args: any[]) => Promise<number>>().mockResolvedValue(4) },
      simulacao: { count: jest.fn<(...args: any[]) => Promise<number>>().mockResolvedValue(3) },
      cenarioPhishing: { count: jest.fn<(...args: any[]) => Promise<number>>().mockResolvedValue(1) },
      prova: { count: jest.fn<(...args: any[]) => Promise<number>>().mockResolvedValue(4) },
      progressoAula: { ...lista(), count: jest.fn<(...args: any[]) => Promise<number>>().mockResolvedValue(0) },
      aula: { count: jest.fn<(...args: any[]) => Promise<number>>().mockResolvedValue(0) },
      tentativaQuiz: lista(),
      tentativaPhishing: lista([{ cenarioId: 'p1', acertou: false, cenario: { titulo: 'Mensagem suspeita', tipo: 'EMAIL' } }]),
      resultadoSimulacao: lista([
        { simulacaoId: 's1', acertos: 2, totalQuestoes: 2, simulacao: { titulo: 'Defesa' } },
        { simulacaoId: 's1', acertos: 1, totalQuestoes: 2, simulacao: { titulo: 'Defesa' } },
      ]),
      tentativaProva: lista([{ provaId: 'a1', totalAcertos: 8, totalQuestoes: 10, prova: { trilha: { nivel: 'BASICO' } } }]),
      resultadoProva: lista([
        { provaId: 'a1', acertos: 8, totalQuestoes: 10, prova: { trilha: { nivel: 'BASICO' } } },
        { provaId: 'a2', acertos: 1, totalQuestoes: 5, prova: { trilha: { nivel: 'AVANCADO' } } },
      ]),
    };
    const result = await new UsuariosService(prisma as unknown as PrismaService).desempenho('aluno-1');
    expect(result.simulacoes).toMatchObject({ conclusao: 50, feitas: 2, realizadas: 3, acertos: 3, erros: 2, aproveitamento: 60,
      melhorResultado: { titulo: 'Defesa', acertos: 3, totalQuestoes: 4, percentual: 75 },
      piorResultado: { titulo: 'Mensagem suspeita', percentual: 0 },
    });
    expect(result.avaliacoes).toMatchObject({ conclusao: 50, feitas: 2, realizadas: 2, acertos: 9, erros: 6,
      melhorResultado: { titulo: 'Básico', percentual: 80 }, piorResultado: { titulo: 'Avançado', percentual: 20 },
    });
  });

  it('não apresenta versões antigas, tentativas sem respostas ou questões de outro quiz como concluídas', async () => {
    const vazio = { findMany: jest.fn<(...args: any[]) => Promise<any[]>>().mockResolvedValue([]) };
    const tentativa = {
      totalQuestoes: 2, totalAcertos: 1,
      quiz: { id: 'atual', titulo: 'Quiz atual', questoes: [{ id: 'q1' }, { id: 'q2' }] },
      respostas: [{ questaoId: 'q1', acertou: true }, { questaoId: 'q2', acertou: false }],
    };
    const prisma = {
      quiz: { count: jest.fn<(...args: any[]) => Promise<number>>().mockResolvedValue(4) },
      simulacao: { count: jest.fn<(...args: any[]) => Promise<number>>().mockResolvedValue(3) },
      cenarioPhishing: { count: jest.fn<(...args: any[]) => Promise<number>>().mockResolvedValue(1) },
      prova: { count: jest.fn<(...args: any[]) => Promise<number>>().mockResolvedValue(4) },
      progressoAula: { ...vazio, count: jest.fn<(...args: any[]) => Promise<number>>().mockResolvedValue(0) },
      aula: { count: jest.fn<(...args: any[]) => Promise<number>>().mockResolvedValue(0) },
      tentativaPhishing: vazio, resultadoSimulacao: vazio, tentativaProva: vazio, resultadoProva: vazio,
      tentativaQuiz: { findMany: jest.fn<(...args: any[]) => Promise<any[]>>().mockResolvedValue([
        { ...tentativa, totalQuestoes: 1, respostas: [tentativa.respostas[0]] },
        { ...tentativa, respostas: [] },
        { ...tentativa, respostas: [{ questaoId: 'outra', acertou: true }, tentativa.respostas[1]] },
        tentativa,
      ]) },
    };
    const result = await new UsuariosService(prisma as unknown as PrismaService).desempenho('aluno-1');
    expect(result.quizzes).toMatchObject({ conclusao: 25, feitos: 1, tentativas: 1, acertos: 1, erros: 1, media: 50 });
    expect(result.quizzes.melhor?.titulo).toBe('Quiz atual');
    expect(prisma.tentativaQuiz.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { usuarioId: 'aluno-1', quiz: { status: 'PUBLICADO' } },
    }));
    prisma.tentativaQuiz.findMany.mockResolvedValue([]);
    const semTentativas = await new UsuariosService(prisma as unknown as PrismaService).desempenho('outro-aluno');
    expect(semTentativas.quizzes).toMatchObject({ conclusao: 0, feitos: 0, tentativas: 0, media: null, melhor: null, pior: null });
  });

  it('preserva sequências acima de 60 dias e soma somente os últimos sete no gráfico', async () => {
    const agora = new Date();
    const progressos = Array.from({ length: 65 }, (_, indice) => ({
      dataConclusao: new Date(agora.getTime() - indice * 86400000),
    }));
    const vazio = { findMany: jest.fn<(...args: any[]) => Promise<any[]>>().mockResolvedValue([]) };
    const prisma = {
      quiz: { count: jest.fn<(...args: any[]) => Promise<number>>().mockResolvedValue(4) },
      simulacao: { count: jest.fn<(...args: any[]) => Promise<number>>().mockResolvedValue(3) },
      cenarioPhishing: { count: jest.fn<(...args: any[]) => Promise<number>>().mockResolvedValue(1) },
      prova: { count: jest.fn<(...args: any[]) => Promise<number>>().mockResolvedValue(4) },
      progressoAula: {
        findMany: jest.fn<(...args: any[]) => Promise<any[]>>().mockResolvedValue(progressos),
        count: jest.fn<(...args: any[]) => Promise<number>>().mockResolvedValue(65),
      },
      aula: { count: jest.fn<(...args: any[]) => Promise<number>>().mockResolvedValue(89) },
      tentativaPhishing: vazio, tentativaQuiz: vazio, resultadoSimulacao: vazio,
      tentativaProva: vazio, resultadoProva: vazio,
    };
    const result = await new UsuariosService(prisma as unknown as PrismaService).desempenho('aluno-1');
    expect(result.ritmo.diasSeguidos).toBe(65);
    expect(result.ritmo.aulasNaSemana).toBe(7);
    expect(result.ritmo.semana).toHaveLength(7);
    expect(prisma.progressoAula.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ concluida: true, aula: expect.any(Object) }),
    }));
  });

  it('retorna somente ritmo, phishing e quizzes do aluno autenticado', async () => {
    const findMany = () => jest.fn<(...args: any[]) => Promise<any[]>>().mockResolvedValue([]);
    const prisma = {
      quiz: { count: jest.fn<(...args: any[]) => Promise<number>>().mockResolvedValue(4) },
      simulacao: { count: jest.fn<(...args: any[]) => Promise<number>>().mockResolvedValue(3) },
      cenarioPhishing: { count: jest.fn<(...args: any[]) => Promise<number>>().mockResolvedValue(1) },
      prova: { count: jest.fn<(...args: any[]) => Promise<number>>().mockResolvedValue(4) },
      progressoAula: { findMany: findMany(), count: jest.fn<(...args: any[]) => Promise<number>>().mockResolvedValue(0) },
      tentativaPhishing: { findMany: findMany() },
      tentativaQuiz: { findMany: findMany() },
      aula: { count: jest.fn<(...args: any[]) => Promise<number>>().mockResolvedValue(0) },
      resultadoSimulacao: { findMany: findMany() },
      tentativaProva: { findMany: findMany() },
      resultadoProva: { findMany: findMany() },
    };
    const service = new UsuariosService(prisma as unknown as PrismaService);
    const result = await service.desempenho('aluno-1');
    expect(Object.keys(result).sort()).toEqual(['aulas', 'avaliacoes', 'phishing', 'quizzes', 'ritmo', 'simulacoes']);
    expect(result.avaliacoes.media).toBeNull();
    expect(result.simulacoes.aproveitamento).toBeNull();
    for (const delegate of [prisma.progressoAula, prisma.tentativaPhishing, prisma.tentativaQuiz, prisma.resultadoSimulacao, prisma.tentativaProva, prisma.resultadoProva]) {
      expect(delegate.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ usuarioId: 'aluno-1' }),
      }));
    }
  });
});
