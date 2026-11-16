import { jest } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AuditoriaService } from '../src/auditoria.service';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { MailService } from '../src/mail/mail.service';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { PrismaService } from '../src/prisma.service';

type UsuarioMock = {
  id: string;
  email: string;
  senhaHash: string;
};

describe('POST /auth/login - integração', () => {
  let app: INestApplication<App>;
  const enviarConfirmacao = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);

  beforeAll(async () => {
    const senhaHash = await bcrypt.hash('Senha123!', 4);
    const prisma = {
      usuario: {
        findUnique: jest
          .fn<(args: { where: { email: string } }) => Promise<UsuarioMock | null>>()
          .mockResolvedValue({
            id: 'usuario-integracao',
            email: 'aluno@exemplo.com',
            senhaHash,
          }),
        create: jest.fn(),
        update: jest.fn<() => Promise<object>>().mockResolvedValue({}),
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      imports: [
        PassportModule.register({}),
        JwtModule.register({ secret: 'segredo-de-teste' }),
      ],
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditoriaService, useValue: { registrar: jest.fn() } },
        { provide: MailService, useValue: { enviarConfirmacaoLogin: enviarConfirmacao } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('valida as credenciais e envia a confirmação por e-mail sem abrir sessão', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'aluno@exemplo.com', password: 'Senha123!' });

    expect(response.status).toBe(200);
    expect(response.body.confirmacaoPendente).toBe(true);
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(enviarConfirmacao).toHaveBeenCalledTimes(1);
  });
});
