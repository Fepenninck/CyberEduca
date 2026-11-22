import type { JwtService } from '@nestjs/jwt';
import { describe, expect, it, jest } from '@jest/globals';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import type { PrismaService } from '../prisma.service';

function setup(consulta: { consultadoEm: Date } | null) {
    const findFirst = jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(consulta);
    return { findFirst, service: new UsuariosService({ consultaSeguranca: { findFirst } } as unknown as PrismaService) };
}

describe('Insígnia do primeiro teste no laboratório', () => {
    it('não concede sem consulta registrada', async () => {
        expect(await setup(null).service.conquistaLaboratorio('aluno')).toEqual({ conquistada: false, conquistadaEm: null });
    });
    it('concede com apenas uma consulta e usa a data da primeira', async () => {
        const data = new Date('2026-11-15T12:00:00Z');
        expect(await setup({ consultadoEm: data }).service.conquistaLaboratorio('aluno')).toEqual({ conquistada: true, conquistadaEm: data.toISOString() });
    });
    it('consulta somente o histórico do aluno e não exige classificação sem detecções', async () => {
        const { service, findFirst } = setup(null);
        await service.conquistaLaboratorio('aluno-autenticado');
        expect(findFirst).toHaveBeenCalledWith({ where: { usuarioId: 'aluno-autenticado' }, orderBy: [{ consultadoEm: 'asc' }, { id: 'asc' }], select: { consultadoEm: true } });
    });
    it('exige autenticação e usa a identidade da sessão', () => {
        const conquistaLaboratorio = jest.fn().mockReturnValue({ conquistada: false, conquistadaEm: null });
        const controller = new UsuariosController({ conquistaLaboratorio } as unknown as UsuariosService, {} as JwtService);
        expect(controller.minhaConquistaLaboratorio({ user: { id: 'aluno' } })).toEqual({ conquistada: false, conquistadaEm: null });
        expect(conquistaLaboratorio).toHaveBeenCalledWith('aluno');
        expect(Reflect.getMetadata(GUARDS_METADATA, UsuariosController.prototype.minhaConquistaLaboratorio)).toContain(JwtAuthGuard);
    });
});
