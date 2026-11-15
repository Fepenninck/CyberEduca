import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const prismaMock = {
    usuario: { findUnique: jest.fn<(...args: any[]) => Promise<any>>() },
  };
  const senhaAlteradaEm = new Date('2026-11-15T12:00:00.000Z');
  const segundosDaTroca = Math.floor(senhaAlteradaEm.getTime() / 1000);
  let strategy: JwtStrategy;

  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'segredo-dos-testes-unitarios';
  });

  beforeEach(() => {
    jest.resetAllMocks();
    strategy = new JwtStrategy(prismaMock as unknown as PrismaService);
    prismaMock.usuario.findUnique.mockResolvedValue({
      id: 'u1',
      nome: 'Ana',
      email: 'ana@test.dev',
      foto: null,
      avatar: 'escudo',
      papel: 'USUARIO',
      senhaHash: 'hash-secreto',
      senhaAlteradaEm,
    });
  });

  it('encerra a sessão de um token emitido antes da troca de senha', async () => {
    await expect(strategy.validate({ sub: 'u1', iat: segundosDaTroca - 1 })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('aceita o token emitido no mesmo segundo da troca e não devolve o hash', async () => {
    const usuario = await strategy.validate({ sub: 'u1', iat: segundosDaTroca });

    expect(usuario).toEqual({
      id: 'u1',
      nome: 'Ana',
      email: 'ana@test.dev',
      foto: null,
      avatar: 'escudo',
      papel: 'USUARIO',
      temSenha: true,
    });
    expect(usuario).not.toHaveProperty('senhaHash');
    expect(usuario).not.toHaveProperty('senhaAlteradaEm');
  });

  it('informa temSenha falso para contas criadas pelo Google', async () => {
    prismaMock.usuario.findUnique.mockResolvedValue({
      id: 'u2',
      nome: 'Bia',
      email: 'bia@test.dev',
      foto: null,
      avatar: null,
      papel: 'USUARIO',
      senhaHash: null,
      senhaAlteradaEm: null,
    });

    await expect(strategy.validate({ sub: 'u2', iat: 1 })).resolves.toMatchObject({ temSenha: false });
  });

  it('rejeita token de usuário que não existe mais', async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(null);

    await expect(strategy.validate({ sub: 'u3', iat: 1 })).rejects.toThrow(UnauthorizedException);
  });
});
