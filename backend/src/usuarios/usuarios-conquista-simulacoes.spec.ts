import { describe, expect, it, jest } from '@jest/globals';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import type { PrismaService } from '../prisma.service';

function setup(simulacoes: boolean[], cenarios: boolean[]) {
    const first = new Date('2026-11-14T12:00:00Z');
    const last = new Date('2026-11-15T12:00:00Z');
    const simulations = jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(simulacoes.map(done => ({ resultados: done ? [{ criadoEm: first }] : [] })));
    const phishing = jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(cenarios.map(done => ({ tentativas: done ? [{ concluidoEm: last }] : [] })));
    const service = new UsuariosService({ simulacao: { findMany: simulations }, cenarioPhishing: { findMany: phishing } } as unknown as PrismaService);
    return { service, simulations, phishing };
}

describe('Insígnia de todas as simulações', () => {
    it('concede somente ao concluir as duas modalidades e usa a última primeira conclusão', async () => {
        const { service } = setup([true, true], [true]);
        expect(await service.conquistaSimulacoes('aluno')).toEqual({ totalSimulacoes: 3, simulacoesConcluidas: 3, conquistada: true, conquistadaEm: '2026-11-15T12:00:00.000Z' });
    });
    it('não concede se faltar um cenário de phishing', async () => {
        expect(await setup([true], [false]).service.conquistaSimulacoes('aluno')).toMatchObject({ totalSimulacoes: 2, simulacoesConcluidas: 1, conquistada: false, conquistadaEm: null });
    });
    it('não concede se faltar uma simulação prática', async () => {
        expect(await setup([false], [true]).service.conquistaSimulacoes('aluno')).toMatchObject({ conquistada: false, conquistadaEm: null });
    });
    it('não concede com catálogo vazio', async () => {
        expect(await setup([], []).service.conquistaSimulacoes('aluno')).toEqual({ totalSimulacoes: 0, simulacoesConcluidas: 0, conquistada: false, conquistadaEm: null });
    });
    it('usa apenas resultados do aluno e o catálogo disponível, sem exigir nota mínima', async () => {
        const { service, simulations, phishing } = setup([], []);
        await service.conquistaSimulacoes('aluno-privado');
        expect(simulations).toHaveBeenCalledWith({ where: { questoes: { some: {} } }, select: { resultados: { where: { usuarioId: 'aluno-privado' }, orderBy: { criadoEm: 'asc' }, take: 1, select: { criadoEm: true } } } });
        expect(phishing).toHaveBeenCalledWith({ where: { status: 'PUBLICADO' }, select: { tentativas: { where: { usuarioId: 'aluno-privado' }, orderBy: { concluidoEm: 'asc' }, take: 1, select: { concluidoEm: true } } } });
    });
    it('encaminha o usuário autenticado do controller', () => {
        const service = { conquistaSimulacoes: jest.fn().mockReturnValue({ conquistada: false }) };
        expect(new UsuariosController(service as unknown as UsuariosService).minhaConquistaSimulacoes({ user: { id: 'aluno' } })).toEqual({ conquistada: false });
        expect(service.conquistaSimulacoes).toHaveBeenCalledWith('aluno');
    });
});
