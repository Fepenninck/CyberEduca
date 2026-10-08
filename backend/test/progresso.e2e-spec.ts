import {
  afterAll,
  beforeAll,
  beforeEach,
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
  AulasController,
} from '../src/aprendizagem/aprendizagem.controller';
import {
  AprendizagemService,
} from '../src/aprendizagem/aprendizagem.service';
import { AuditoriaService } from '../src/auditoria.service';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { PrismaService } from '../src/prisma.service';

const usuarioId =
  '00000000-0000-4000-8000-000000000001';

const trilhaId =
  '00000000-0000-4000-8000-000000000002';

const aulaId =
  '00000000-0000-4000-8000-000000000003';

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

describe('Progresso das aulas - integração', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        controllers: [
          AulasController,
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


    await prisma.logAuditoria.deleteMany({
      where: {
        atorId: usuarioId,
      },
    });

    await prisma.progressoAula.deleteMany({
      where: {
        usuarioId,
      },
    });

    await prisma.aula.deleteMany({
      where: {
        id: aulaId,
      },
    });

    await prisma.trilha.deleteMany({
      where: {
        id: trilhaId,
      },
    });

    await prisma.usuario.deleteMany({
      where: {
        id: usuarioId,
      },
    });

    await prisma.usuario.create({
      data: {
        id: usuarioId,
        nome: 'Usuário de integração',
        email: 'integracao.progresso@cybereduca.test',
        papel: 'USUARIO',
      },
    });
    
    await prisma.trilha.create({
      data: {
        id: trilhaId,
        titulo: 'Trilha de integração',
        descricao: 'Trilha usada apenas pelos testes',
        ordem: 9999,
        bloqueada: false,
      },
    });

    
    await prisma.aula.create({
      data: {
        id: aulaId,
        titulo: 'Aula de integração',
        conteudo: 'Conteúdo usado nos testes',
        ordem: 1,
        trilhaId,
      },
    });
  });

  beforeEach(async () => {
    
    await prisma.logAuditoria.deleteMany({
      where: {
        atorId: usuarioId,
      },
    });

    await prisma.progressoAula.deleteMany({
      where: {
        usuarioId,
      },
    });
  });

  it(
    'deve salvar e recuperar o progresso no banco de teste',
    async () => {
      const progressoGravado =
        await prisma.progressoAula.create({
          data: {
            usuarioId,
            aulaId,
            concluida: true,
          },
        });

      const progressoRecuperado =
        await prisma.progressoAula.findUnique({
          where: {
            usuarioId_aulaId: {
              usuarioId,
              aulaId,
            },
          },
        });

      expect(progressoRecuperado).not.toBeNull();

      expect(progressoRecuperado).toMatchObject({
        id: progressoGravado.id,
        usuarioId,
        aulaId,
        concluida: true,
      });

      expect(
        progressoRecuperado?.dataConclusao,
      ).toEqual(
        progressoGravado.dataConclusao,
      );
    },
  );

  it(
    'deve concluir uma aula pelo fluxo API, Controller, Service e Banco',
    async () => {
      await request(app.getHttpServer())
        .post(`/aulas/${aulaId}/concluir`)
        .expect(201)
        .expect({
          aulaId,
          concluida: true,
          percentualTrilha: 100,
        });

      const progressoRecuperado =
        await prisma.progressoAula.findUnique({
          where: {
            usuarioId_aulaId: {
              usuarioId,
              aulaId,
            },
          },
        });

      expect(progressoRecuperado).not.toBeNull();

      expect(progressoRecuperado).toMatchObject({
        usuarioId,
        aulaId,
        concluida: true,
      });

      const auditoria =
        await prisma.logAuditoria.findFirst({
          where: {
            atorId: usuarioId,
            entidadeId: aulaId,
          },
        });

      expect(auditoria).not.toBeNull();
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
