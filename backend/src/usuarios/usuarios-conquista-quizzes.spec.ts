import { describe, expect, it, jest } from '@jest/globals';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import type { PrismaService } from '../prisma.service';

const primeira = new Date('2026-11-14T12:00:00Z');
const ultima = new Date('2026-11-15T12:00:00Z');
const tentativa = (ids: string[], data = primeira) => ({ totalQuestoes: ids.length, concluidoEm: data, respostas: ids.map(questaoId => ({ questaoId })) });
const quiz = (ids: string[], tentativas: ReturnType<typeof tentativa>[] = []) => ({ questoes: ids.map(id => ({ id })), tentativas });
function setup(quizzes: ReturnType<typeof quiz>[]) {
  const findMany = jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(quizzes);
  return { findMany, service: new UsuariosService({ quiz: { findMany } } as unknown as PrismaService) };
}

describe('Insígnia de todos os quizzes', () => {
  it('não concede quando o catálogo está vazio', async () => {
    expect(await setup([]).service.conquistaQuizzes('aluno')).toEqual({ totalQuizzes: 0, quizzesConcluidos: 0, conquistada: false, conquistadaEm: null });
  });
  it('mantém em progresso se falta um quiz', async () => {
    expect(await setup([quiz(['a'], [tentativa(['a'])]), quiz(['b'])]).service.conquistaQuizzes('aluno')).toMatchObject({ totalQuizzes: 2, quizzesConcluidos: 1, conquistada: false, conquistadaEm: null });
  });
  it('não concede pela tentativa antiga de uma pergunta em um quiz ampliado para dez', async () => {
    const ids = Array.from({ length: 10 }, (_, i) => `q${i}`);
    expect(await setup([quiz(ids, [tentativa([ids[0]])])]).service.conquistaQuizzes('aluno')).toMatchObject({ quizzesConcluidos: 0, conquistada: false });
  });
  it('concede ao completar todos e usa a última primeira conclusão válida', async () => {
    expect(await setup([quiz(['a'], [tentativa(['a']), tentativa(['a'], ultima)]), quiz(['b'], [tentativa(['b'], ultima)])]).service.conquistaQuizzes('aluno')).toEqual({ totalQuizzes: 2, quizzesConcluidos: 2, conquistada: true, conquistadaEm: ultima.toISOString() });
  });
  it('não aceita respostas incompletas, repetidas ou de questões diferentes', async () => {
    const invalida = { ...tentativa(['a']), totalQuestoes: 2 };
    expect(await setup([quiz(['a', 'b'], [invalida, tentativa(['a', 'a']), tentativa(['a', 'c'])])]).service.conquistaQuizzes('aluno')).toMatchObject({ quizzesConcluidos: 0, conquistada: false });
  });
  it('não concede com quiz sem perguntas', async () => {
    expect(await setup([quiz([])]).service.conquistaQuizzes('aluno')).toMatchObject({ totalQuizzes: 1, quizzesConcluidos: 0, conquistada: false });
  });
  it('consulta apenas quizzes publicados e tentativas do aluno, sem exigir acertos', async () => {
    const { findMany, service } = setup([quiz(['a'], [tentativa(['a'])])]);
    expect((await service.conquistaQuizzes('aluno-autenticado')).conquistada).toBe(true);
    expect(findMany).toHaveBeenCalledWith({ where: { status: 'PUBLICADO' }, select: {
      questoes: { select: { id: true } },
      tentativas: { where: { usuarioId: 'aluno-autenticado' }, orderBy: { concluidoEm: 'asc' }, select: { totalQuestoes: true, concluidoEm: true, respostas: { select: { questaoId: true } } } },
    } });
  });
  it('usa o usuário autenticado do controller', () => {
    const conquistaQuizzes = jest.fn().mockReturnValue({ conquistada: false });
    expect(new UsuariosController({ conquistaQuizzes } as unknown as UsuariosService).minhaConquistaQuizzes({ user: { id: 'aluno' } })).toEqual({ conquistada: false });
    expect(conquistaQuizzes).toHaveBeenCalledWith('aluno');
  });
});
