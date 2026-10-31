import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import { randomUUID } from 'node:crypto';
import {
  type INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import request from 'supertest';

import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { JwtStrategy } from '../src/auth/jwt.strategy';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import {
  TrilhasController,
  AulasController,
} from '../src/aprendizagem/aprendizagem.controller';
import { AprendizagemService } from '../src/aprendizagem/aprendizagem.service';
import { PrismaService } from '../src/prisma.service';
import { AuditoriaService } from '../src/auditoria.service';

describe('Integração HTTP de trilhas e aulas', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let url: string;
  let cookie: string;
  let usuarioId: string;

  const usuariosCriados: string[] = [];
  const trilhasCriadas: string[] = [];

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'segredo-exclusivo-dos-testes-locais';

    const modulo = await Test.createTestingModule({
      imports: [
        PassportModule.register({}),
        JwtModule.register({
          secret: process.env.JWT_SECRET,
        }),
      ],
      controllers: [
        AuthController,
        TrilhasController,
        AulasController,
      ],
      providers: [
        AuthService,
        JwtStrategy,
        JwtAuthGuard,
        AprendizagemService,
        PrismaService,
        AuditoriaService,
      ],
    }).compile();

    app = modulo.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    // O sistema operacional escolhe uma porta disponível.
    await app.listen(0, '127.0.0.1');

    url = await app.getUrl();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    const email = `${randomUUID()}@cybereduca.test`;

    const cadastro = await request(url)
      .post('/auth/register')
      .send({
        name: 'Aluno de integração',
        email,
        password: 'Senha123!',
      })
      .expect(201);

    usuarioId = cadastro.body.user.id;
    usuariosCriados.push(usuarioId);

    const login = await request(url)
      .post('/auth/login')
      .send({
        email,
        password: 'Senha123!',
      })
      .expect(200);

    // Guarda somente nome e valor do cookie de sessão.
    const cookies = login.headers['set-cookie'];
    expect(cookies).toBeDefined();

    cookie = cookies[0].split(';')[0];

    expect(cookie).toMatch(/^cybereduca_session=.+/);
  });
  
  async function criarTrilha(ordem = 1) {
  const dados = {
    titulo: `Trilha ${randomUUID()}`,
    descricao: 'Introdução à segurança digital',
    ordem,
  };

  const resposta = await request(url)
    .post('/trilhas')
    .set('Cookie', cookie)
    .send(dados)
    .expect(201);

  trilhasCriadas.push(resposta.body.id);

  expect(resposta.body).toMatchObject({
    id: expect.any(String),
    ...dados,
  });

  return resposta.body;
}

  async function criarAula(trilhaId: string, ordem = 1) {
    const dados = {
      titulo: 'Identificando phishing',
      conteudo: 'Confira o remetente e os links da mensagem.',
      ordem,
      trilhaId,
    };

    const resposta = await request(url)
      .post('/aulas')
      .set('Cookie', cookie)
      .send(dados)
      .expect(201);

    expect(resposta.body).toMatchObject({
      id: expect.any(String),
      ...dados,
    });

    return resposta.body;
  }

  it('criarTrilha_comDadosValidos_deveRetornar201EPersistir', async () => {
    // Arrange: prepara os dados.
    const dados = {
      titulo: `Trilha ${randomUUID()}`,
      descricao: 'Introdução à segurança digital',
      ordem: 1,
    };

    // Act: faz uma chamada HTTP real.
    const resposta = await request(url)
      .post('/trilhas')
      .set('Cookie', cookie)
      .send(dados)
      .expect(201);

    trilhasCriadas.push(resposta.body.id);

    // Assert: verifica o corpo da resposta.
    expect(resposta.body).toMatchObject({
      id: expect.any(String),
      ...dados,
    });

    // Confirma que os dados foram gravados no banco.
    const trilhaNoBanco = await prisma.trilha.findUnique({
      where: {
        id: resposta.body.id,
      },
    });

    expect(trilhaNoBanco).toMatchObject({
      id: resposta.body.id,
      ...dados,
    });
  });

  it('listarTrilhas_comTrilhaCriada_deveRetornar200ComItemNaLista', async () => {
    const trilha = await criarTrilha();

    const resposta = await request(url)
      .get('/trilhas')
      .set('Cookie', cookie)
      .expect(200);

    expect(resposta.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: trilha.id,
          titulo: trilha.titulo,
          descricao: trilha.descricao,
          totalAulas: 0,
          percentual: 0,
        }),
      ]),
    );
  });

  it('detalharTrilha_comPermissao_deveRetornar200ComDados', async () => {
    const trilha = await criarTrilha();

    const resposta = await request(url)
      .get(`/trilhas/${trilha.id}`)
      .set('Cookie', cookie)
      .expect(200);

    expect(resposta.body).toMatchObject({
      id: trilha.id,
      titulo: trilha.titulo,
      descricao: trilha.descricao,
      bloqueada: false,
      percentual: 0,
      aulas: [],
    });
  });

  it('editarTrilha_comIdExistente_deveRetornar200EPersistir', async () => {
    const trilha = await criarTrilha();

    const alteracoes = {
      titulo: 'Trilha atualizada',
      descricao: 'Descrição revisada',
    };

    const resposta = await request(url)
      .patch(`/trilhas/${trilha.id}`)
      .set('Cookie', cookie)
      .send(alteracoes)
      .expect(200);

    expect(resposta.body).toMatchObject({
      id: trilha.id,
      ...alteracoes,
    });

    const trilhaNoBanco = await prisma.trilha.findUnique({
      where: {
        id: trilha.id,
      },
    });

    expect(trilhaNoBanco).toMatchObject({
      id: trilha.id,
      ...alteracoes,
    });
  });

  it('criarAula_comTrilhaExistente_deveRetornar201EPersistirVinculo', async () => {
    const trilha = await criarTrilha();
    const aula = await criarAula(trilha.id);

    const aulaNoBanco = await prisma.aula.findUnique({
      where: { id: aula.id },
    });

    expect(aulaNoBanco).toMatchObject({
      id: aula.id,
      titulo: aula.titulo,
      conteudo: aula.conteudo,
      ordem: 1,
      trilhaId: trilha.id,
    });

    // Confirma o relacionamento também pela API.
    const detalhe = await request(url)
      .get(`/trilhas/${trilha.id}`)
      .set('Cookie', cookie)
      .expect(200);

    expect(detalhe.body).toMatchObject({
      id: trilha.id,
      aulas: [
        expect.objectContaining({
          id: aula.id,
          titulo: aula.titulo,
          concluida: false,
        }),
      ],
    });
  });

  it('buscarAula_comIdExistente_deveRetornar200ComConteudo', async () => {
    const trilha = await criarTrilha();
    const aula = await criarAula(trilha.id);

    const resposta = await request(url)
      .get(`/aulas/${aula.id}`)
      .set('Cookie', cookie)
      .expect(200);

    expect(resposta.body).toMatchObject({
      id: aula.id,
      titulo: aula.titulo,
      conteudo: aula.conteudo,
      ordem: 1,
      concluida: false,
      trilha: {
        id: trilha.id,
        titulo: trilha.titulo,
      },
      anterior: null,
      proxima: null,
    });
  });

  it('editarAula_comIdExistente_deveRetornar200EPersistir', async () => {
    const trilha = await criarTrilha();
    const aula = await criarAula(trilha.id);

    const alteracoes = {
      titulo: 'Phishing e mensagens suspeitas',
      conteudo: 'Nunca informe sua senha por mensagens.',
    };

    const resposta = await request(url)
      .patch(`/aulas/${aula.id}`)
      .set('Cookie', cookie)
      .send(alteracoes)
      .expect(200);

    expect(resposta.body).toMatchObject({
      id: aula.id,
      trilhaId: trilha.id,
      ...alteracoes,
    });

    const aulaNoBanco = await prisma.aula.findUnique({
      where: { id: aula.id },
    });

    expect(aulaNoBanco).toMatchObject({
      id: aula.id,
      trilhaId: trilha.id,
      ...alteracoes,
    });
  });

  it('concluirAula_comIdExistente_deveRetornar201EPersistirProgresso', async () => {
    const trilha = await criarTrilha();
    const aula = await criarAula(trilha.id);

    const resposta = await request(url)
      .post(`/aulas/${aula.id}/concluir`)
      .set('Cookie', cookie)
      .expect(201);

    expect(resposta.body).toEqual({
      aulaId: aula.id,
      concluida: true,
      percentualTrilha: 100,
    });

    const progresso = await prisma.progressoAula.findUnique({
      where: {
        usuarioId_aulaId: {
          usuarioId,
          aulaId: aula.id,
        },
      },
    });

    expect(progresso).toMatchObject({
      usuarioId,
      aulaId: aula.id,
      concluida: true,
      dataConclusao: expect.any(Date),
    });

    const auditoria = await prisma.logAuditoria.findFirst({
      where: {
        atorId: usuarioId,
        entidadeId: aula.id,
        acao: 'CONCLUIR_AULA',
      },
    });

    expect(auditoria).toMatchObject({
      entidade: 'Aula',
      sucesso: true,
    });
  });

  it('detalharTrilha_semSessao_deveRetornar401ComMensagem', async () => {
    const trilha = await criarTrilha();

    const resposta = await request(url)
      .get(`/trilhas/${trilha.id}`)
      .expect(401);

    expect(resposta.body).toMatchObject({
      statusCode: 401,
      message: 'Unauthorized',
    });
  });

  it('detalharTrilha_semConcluirAnterior_deveRetornar403ComMensagem', async () => {
    // Cria uma trilha anterior com uma aula ainda não concluída.
    const anterior = await criarTrilha(1);
    await criarAula(anterior.id);

    const bloqueada = await criarTrilha(2);

    // Prepara o estado de bloqueio diretamente no banco.
    await prisma.trilha.update({
      where: { id: bloqueada.id },
      data: { bloqueada: true },
    });

    const resposta = await request(url)
      .get(`/trilhas/${bloqueada.id}`)
      .set('Cookie', cookie)
      .expect(403);

    expect(resposta.body).toMatchObject({
      statusCode: 403,
      error: 'Forbidden',
      message:
        'Conclua as trilhas anteriores para desbloquear este conteúdo.',
    });
  });

  it('detalharTrilha_comIdInexistente_deveRetornar404ComMensagem', async () => {
    const resposta = await request(url)
      .get(`/trilhas/${randomUUID()}`)
      .set('Cookie', cookie)
      .expect(404);

    expect(resposta.body).toMatchObject({
      statusCode: 404,
      message: 'Trilha nao encontrada',
    });
  });

  it('buscarAula_comIdInexistente_deveRetornar404ComMensagem', async () => {
    const resposta = await request(url)
      .get(`/aulas/${randomUUID()}`)
      .set('Cookie', cookie)
      .expect(404);

    expect(resposta.body).toMatchObject({
      statusCode: 404,
      message: 'Aula nao encontrada',
    });
  });

  it('login_comCredenciaisValidas_deveRetornar200ECookieHttpOnly', async () => {
    const usuario = await prisma.usuario.findUniqueOrThrow({
      where: { id: usuarioId },
    });

    const resposta = await request(url)
      .post('/auth/login')
      .send({
        email: usuario.email,
        password: 'Senha123!',
      })
      .expect(200);

    expect(resposta.body).toEqual({
      message: 'Login realizado com sucesso!',
    });

    expect(resposta.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringMatching(
          /^cybereduca_session=.+;.*HttpOnly/,
        ),
      ]),
    );
  });

  afterAll(async () => {
    try {
      if (prisma) {
        await prisma.logAuditoria.deleteMany({
          where: {
            atorId: {
              in: usuariosCriados,
            },
          },
        });

        await prisma.usuario.deleteMany({
          where: {
            id: {
              in: usuariosCriados,
            },
          },
        });

        // As aulas e seus progressos são removidos por cascade.
        await prisma.trilha.deleteMany({
          where: {
            id: {
              in: trilhasCriadas,
            },
          },
        });
      }
    } finally {
      if (prisma) {
        await prisma.$disconnect();
      }

      if (app) {
        await app.close();
      }
    }
  });
});
