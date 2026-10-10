import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  type CanActivate,
  type ExecutionContext,
  type INestApplication,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import {
  TrilhasController,
} from '../src/aprendizagem/aprendizagem.controller';
import {
  AprendizagemService,
} from '../src/aprendizagem/aprendizagem.service';
import { AuditoriaService } from '../src/auditoria.service';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { PrismaService } from '../src/prisma.service';

const usuarioId =
  '00000000-0000-4000-8000-000000000010';

const trilhaInexistenteId =
  '00000000-0000-4000-8000-0000000000ff';

class TestAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requisicao = context
      .switchToHttp()
      .getRequest();

    requisicao.user = {
      id: usuarioId,
    };

    return true;
  }
}

describe('Detalhamento de trilhas - integração', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        controllers: [
          TrilhasController,
        ],

        providers: [
          AprendizagemService,
          PrismaService,
          AuditoriaService,
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useClass(TestAuthGuard)
        .compile();

    app = moduleFixture.createNestApplication();

    await app.init();

    prisma = app.get(PrismaService);

    // Garante que a trilha realmente não existe no banco de teste
    await prisma.trilha.deleteMany({
      where: {
        id: trilhaInexistenteId,
      },
    });
  });

  it(
    'deve retornar 404 ao detalhar uma trilha inexistente pela API',
    async () => {
      const resposta = await request(app.getHttpServer())
        .get(`/trilhas/${trilhaInexistenteId}`)
        .expect(404);

      expect(resposta.body).toEqual({
        statusCode: 404,
        message: 'Trilha nao encontrada',
        error: 'Not Found',
      });

      const trilhaNoBanco =
        await prisma.trilha.findUnique({
          where: {
            id: trilhaInexistenteId,
          },
        });

      expect(trilhaNoBanco).toBeNull();
    },
  );

  afterAll(async () => {
    if (app) {
      await app.close();
    }

    if (prisma) {
      await prisma.$disconnect();
    }
  });
});