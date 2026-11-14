import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { ExecutionContext } from '@nestjs/common';
import { LoginRateLimitGuard } from './login-rate-limit.guard';

function context(ip: string, email: string) {
  const setHeader = jest.fn();
  return {
    setHeader,
    value: { switchToHttp: () => ({
      getRequest: () => ({ ip, body: { email } }),
      getResponse: () => ({ setHeader }),
    }) } as unknown as ExecutionContext,
  };
}

describe('LoginRateLimitGuard', () => {
  afterEach(() => { jest.restoreAllMocks(); });

  it('limita a conta mesmo trocando IP e normaliza o email', () => {
    const guard = new LoginRateLimitGuard();
    for (let i = 0; i < 5; i++) expect(guard.canActivate(context(`ip${i}`, 'Aluno@teste.com').value)).toBe(true);
    const request = context('outro-ip', ' aluno@teste.com ');
    expect(() => guard.canActivate(request.value)).toThrow('Muitas tentativas');
    expect(request.setHeader).toHaveBeenCalledWith('Retry-After', 900);
  });

  it('limita o IP mesmo trocando de conta', () => {
    const guard = new LoginRateLimitGuard();
    for (let i = 0; i < 30; i++) guard.canActivate(context('mesmo-ip', `aluno${i}@teste.com`).value);
    expect(() => guard.canActivate(context('mesmo-ip', 'nova@teste.com').value)).toThrow('Muitas tentativas');
    expect(guard.canActivate(context('outro-ip', 'outra@teste.com').value)).toBe(true);
  });

  it('libera novas tentativas depois de quinze minutos', () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(0);
    const guard = new LoginRateLimitGuard();
    const request = context('ip', 'aluno@teste.com').value;
    for (let i = 0; i < 5; i++) guard.canActivate(request);
    expect(() => guard.canActivate(request)).toThrow();
    now.mockReturnValue(900000);
    expect(guard.canActivate(request)).toBe(true);
  });
});
