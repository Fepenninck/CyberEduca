// backend/src/auth/auth.service.spec.ts
import { jest } from '@jest/globals';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuditoriaService } from '../auditoria.service';
import { PrismaService } from '../prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    usuario: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };
  let jwtService: { sign: jest.Mock };
  let auditoria: { registrar: jest.Mock };

  beforeEach(async () => {
    prisma = {
      usuario: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    jwtService = { sign: jest.fn().mockReturnValue('jwt-de-teste') };
    auditoria = { registrar: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: AuditoriaService, useValue: auditoria },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('faz login válido e assina o token', async () => {
    const senhaHash = await bcrypt.hash('Senha123!', 4);
    prisma.usuario.findUnique.mockResolvedValue({
      id: 'usuario-1',
      email: 'aluno@exemplo.com',
      senhaHash,
    });

    await expect(
      service.login(
        { email: 'aluno@exemplo.com', password: 'Senha123!' },
        { ip: '127.0.0.1' },
      ),
    ).resolves.toEqual({
      message: 'Login realizado com sucesso!',
      access_token: 'jwt-de-teste',
    });

    // Confirma as interações com os mocks no caminho feliz.
    expect(prisma.usuario.findUnique).toHaveBeenCalled();
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 'usuario-1',
      email: 'aluno@exemplo.com',
    });
  });

  it('rejeita cadastro quando o e-mail já existe', async () => {
    prisma.usuario.findUnique.mockResolvedValue({ id: 'usuario-existente' });

    // Valida a exceção obrigatória com rejects.toThrow().
    await expect(
      service.register(
        { name: 'Aluno', email: 'aluno@exemplo.com', password: 'Senha123!' },
        {},
      ),
    ).rejects.toThrow(BadRequestException);

    // Garante que as operações posteriores não autorizadas nunca ocorreram.
    expect(prisma.usuario.create).not.toHaveBeenCalled();
    expect(auditoria.registrar).not.toHaveBeenCalled();
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('rejeita login de conta Google sem senha cadastrada', async () => {
    prisma.usuario.findUnique.mockResolvedValue({
      id: 'google-1',
      email: 'google@exemplo.com',
      senhaHash: null,
    });

    await expect(
      service.login(
        { email: 'google@exemplo.com', password: 'qualquer' },
        {},
      ),
    ).rejects.toThrow(UnauthorizedException);

    expect(jwtService.sign).not.toHaveBeenCalled();
  });
});
