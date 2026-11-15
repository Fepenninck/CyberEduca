import { describe, expect, it, jest } from '@jest/globals';
import { EXAM_IDS, LEVELS, loadCertificationProgress, passed, RETRY_DELAY } from './certification-progress';
import { selectPaper } from './certificacoes.service';
import type { PrismaService } from '../prisma.service';

const now = new Date('2026-11-15T12:00:00Z');
function fixture(options: { missingLesson?: boolean; attempts?: any[]; empty?: boolean; incompleteBank?: boolean } = {}) {
 const lessons = options.empty ? [] : LEVELS.map((nivel, index) => ({ id: `lesson-${nivel}`, trilha: { nivel }, progressos: options.missingLesson && index === 0 ? [] : [{ dataConclusao: now }] }));
 const exams = LEVELS.map(nivel => ({ id: EXAM_IDS[nivel], questoes: Array.from({ length: options.incompleteBank ? 1 : 2 }, (_, index) => ({ id: `${nivel}-${index}`, explicacao: `[aula:lesson-${nivel}] explicação`, _count: { alternativas: 2 } })) }));
 const prisma = { aula: { findMany: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(lessons) }, prova: { findMany: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(exams) }, tentativaProva: { findMany: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(options.attempts ?? []) } };
 return { prisma, db: prisma as unknown as PrismaService };
}
const attempt = (nivel: typeof LEVELS[number], totalAcertos: number, date = now) => ({ id: `attempt-${nivel}`, provaId: EXAM_IDS[nivel], nota: totalAcertos, totalAcertos, totalQuestoes: 10, concluidoEm: date });
describe('Certificação e avanço entre níveis', () => {
 it('libera a prova básica após as aulas, mas mantém os níveis seguintes bloqueados', async () => {
  const result = await loadCertificationProgress(fixture().db, 'user', now);
  expect(result[0]).toMatchObject({ podeIniciar: true, conquistada: false });
  expect(result.slice(1).every(item => !item.desbloqueado && !item.podeIniciar && !item.conquistada)).toBe(true);
 });
 it('não libera prova nem insígnia com aula pendente', async () => {
  const result = await loadCertificationProgress(fixture({ missingLesson: true, attempts: [attempt('BASICO', 10)] }).db, 'user', now);
  expect(result[0]).toMatchObject({ motivo: 'AULAS_PENDENTES', aprovado: false, conquistada: false });
 });
 it('aplica nota 6 e só libera o nível imediatamente seguinte após aprovação', async () => {
  const result = await loadCertificationProgress(fixture({ attempts: [attempt('BASICO', 6)] }).db, 'user', now);
  expect(result[0]).toMatchObject({ aprovado: true, conquistada: true, conquistadaEm: now.toISOString() });
  expect(result[1]).toMatchObject({ desbloqueado: true, podeIniciar: true });
  expect(result[2]).toMatchObject({ desbloqueado: false });
 });
 it('exige exatamente 24 horas e mantém a reprovação no histórico', async () => {
  const { db } = fixture({ attempts: [attempt('BASICO', 5)] });
  expect((await loadCertificationProgress(db, 'user', new Date(now.getTime() + RETRY_DELAY - 1)))[0]).toMatchObject({ podeIniciar: false, motivo: 'AGUARDE' });
  expect((await loadCertificationProgress(db, 'user', new Date(now.getTime() + RETRY_DELAY)))[0]).toMatchObject({ podeIniciar: true, ultimaTentativa: { nota: 5 } });
 });
 it('não aprova por arredondamento nem com prova sem questões', () => {
  expect(passed({ totalAcertos: 119, totalQuestoes: 200 })).toBe(false);
  expect(passed({ totalAcertos: 120, totalQuestoes: 200 })).toBe(true);
  expect(passed({ totalAcertos: 0, totalQuestoes: 0 })).toBe(false);
 });
 it('não concede insígnia a nível vazio e bloqueia banco sem variantes suficientes', async () => {
  expect((await loadCertificationProgress(fixture({ empty: true }).db, 'user', now)).every(item => !item.conquistada && !item.podeIniciar)).toBe(true);
  expect((await loadCertificationProgress(fixture({ incompleteBank: true }).db, 'user', now))[0].motivo).toBe('BANCO_INCOMPLETO');
 });
 it('consulta somente o usuário autenticado e exclui a trilha retirada', async () => {
  const { prisma, db } = fixture(); await loadCertificationProgress(db, 'private-user', now);
  expect(prisma.aula.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { trilhaId: { not: '4328594b-f7cb-52d2-862f-e612b1647aa9' } }, select: expect.objectContaining({ progressos: { where: { usuarioId: 'private-user', concluida: true }, select: { dataConclusao: true } } }) }));
  expect(prisma.tentativaProva.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ usuarioId: 'private-user', concluidoEm: { not: null } }) }));
 });
 it('troca todas as questões da tentativa anterior mantendo uma por aula e não muda ao atualizar', () => {
  const bank = ['a', 'b', 'c'].flatMap(lesson => [0, 1].map(index => ({ id: `${lesson}-${index}`, enunciado: `Caso ${lesson} ${index}`, explicacao: `[aula:${lesson}] explicação`, alternativas: [] })));
  const first = selectPaper(bank, ['a', 'b', 'c'], 'first', new Set());
  expect(selectPaper(bank, ['a', 'b', 'c'], 'first', new Set())).toEqual(first);
  const previous = new Set(first.map(item => item.id));
  const next = selectPaper(bank, ['a', 'b', 'c'], 'next', previous);
  expect(next).toHaveLength(3); expect(next.every(item => !previous.has(item.id))).toBe(true);
 });
});
