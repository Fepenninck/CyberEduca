import { describe, expect, it } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';

const contexto = (user?: { papel: string }) =>
  ({ switchToHttp: () => ({ getRequest: () => ({ user }) }) }) as any;

describe('AdminGuard (admin)', () => {
  it('libera administradores', () => {
    expect(new AdminGuard().canActivate(contexto({ papel: 'ADMIN' }))).toBe(true);
  });

  it('bloqueia quem não é administrador', () => {
    expect(() => new AdminGuard().canActivate(contexto({ papel: 'ALUNO' }))).toThrow('Acesso restrito a administradores.');
    expect(() => new AdminGuard().canActivate(contexto())).toThrow(ForbiddenException);
  });
});
