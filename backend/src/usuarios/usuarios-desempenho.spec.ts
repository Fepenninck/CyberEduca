import { describe, expect, it, jest } from '@jest/globals';
import { UsuariosService } from './usuarios.service';
import type { PrismaService } from '../prisma.service';

describe('Desempenho pessoal sem comparação entre alunos', () => {
  it('retorna somente ritmo, phishing e quizzes do aluno autenticado', async () => {
    const findMany = () => jest.fn<(...args: any[]) => Promise<any[]>>().mockResolvedValue([]);
    const prisma = {
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
