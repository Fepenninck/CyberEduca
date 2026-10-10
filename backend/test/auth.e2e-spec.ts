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
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { PrismaService } from '../src/prisma.service';

describe('POST /auth/login - integração', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const senhaHash = await bcrypt.hash('Senha123!', 4);
    const prisma = {
      usuario: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'usuario-integracao',
          email: 'aluno@exemplo.com',
          senhaHash,
        }),
        create: jest.fn(),
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      imports: [
        PassportModule.register(),
        JwtModule.register({ secret: 'segredo-de-teste' }),
      ],
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditoriaService, useValue: { registrar: jest.fn() } },
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

  it('responde com sucesso ao autenticar pelo endpoint HTTP', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'aluno@exemplo.com', password: 'Senha123!' });

    // Verifica o status HTTP exato definido pelo controller (200).
    expect(response.status).toBe(200);
    // Verifica uma propriedade específica presente no corpo da resposta.
    expect(response.body.message).toBe('Login realizado com sucesso!');
    expect(response.headers['set-cookie']).toBeDefined();
  });
});
