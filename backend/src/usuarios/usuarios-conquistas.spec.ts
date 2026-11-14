import { describe, expect, it, jest } from '@jest/globals';
import { UsuariosService } from './usuarios.service';
import type { PrismaService } from '../prisma.service';

const aula = (nivel: string, concluida: boolean, date = '2026-11-14T10:00:00Z') => ({
  trilha: { nivel }, progressos: concluida ? [{ dataConclusao: new Date(date) }] : [],
});
function setup(aulas: ReturnType<typeof aula>[]) {
  const findMany = jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(aulas);
  return { service: new UsuariosService({ aula: { findMany } } as unknown as PrismaService), findMany };
}

describe('Conquistas por nível', () => {
  it('reconhece o nível completo e usa a data da última aula', async () => {
    const { service } = setup([aula('BASICO', true), aula('BASICO', true, '2026-11-14T12:00:00Z'), aula('INTERMEDIARIO', false)]);
    const result = await service.conquistas('aluno-1');
    expect(result[0]).toEqual({ nivel: 'BASICO', totalAulas: 2, aulasConcluidas: 2, conquistada: true, conquistadaEm: '2026-11-14T12:00:00.000Z' });
    expect(result[1].conquistada).toBe(false);
    expect(result[2].conquistada).toBe(false);
  });
  it('não concede por arredondamento nem por nível sem aulas', async () => {
    const { service } = setup([...Array.from({ length: 200 }, () => aula('BASICO', true)), aula('BASICO', false)]);
    const result = await service.conquistas('aluno-1');
    expect(result.every(item => !item.conquistada && item.conquistadaEm === null)).toBe(true);
  });
  it('avalia os três níveis separadamente', async () => {
    const { service } = setup([aula('BASICO', true), aula('INTERMEDIARIO', true), aula('AVANCADO', true)]);
    expect((await service.conquistas('aluno-1')).every(item => item.conquistada)).toBe(true);
  });
  it('consulta somente conclusões do aluno autenticado e preserva o catálogo retirado', async () => {
    const { service, findMany } = setup([]);
    await service.conquistas('aluno-privado');
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { trilhaId: { not: '4328594b-f7cb-52d2-862f-e612b1647aa9' } },
      select: expect.objectContaining({ progressos: { where: { usuarioId: 'aluno-privado', concluida: true }, select: { dataConclusao: true } } }),
    }));
  });
});
