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
import { AuditoriaContexto } from '../src/auditoria-contexto';
import { MailService } from '../src/mail/mail.service';

describe('Integração HTTP de trilhas e aulas', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let url: string;
  let cookie: string;
  let usuarioId: string;

  const usuariosCriados: string[] = [];
  const trilhasCriadas: string[] = [];
  const linksEnviados: string[] = [];

  const mailFalso = {
    enviarConfirmacaoLogin: async (_destinatario: unknown, link: string) => {
      linksEnviados.push(link);
    },
    enviarRecuperacaoSenha: async (_destinatario: unknown, link: string) => {
      linksEnviados.push(link);
    },
  };

  function tokenDoUltimoLink() {
    return new URL(linksEnviados[linksEnviados.length - 1]).searchParams.get('token');
  }

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
        AuditoriaContexto,
        { provide: MailService, useValue: mailFalso },
      ],
    }).compile();

    app = modulo.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

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

    expect(login.body.confirmacaoPendente).toBe(true);
    expect(login.headers['set-cookie']).toBeUndefined();

    const confirmacao = await request(url)
      .post('/auth/login/confirmar')
      .send({ token: tokenDoUltimoLink() })
      .expect(200);

    const cookies = confirmacao.headers['set-cookie'];
    expect(cookies).toBeDefined();

    cookie = cookies[0].split(';')[0];

    expect(cookie).toMatch(/^cybereduca_session=.+/);
  });
  
  async function criarTrilha(ordem = 1) {
  // Somente os cenários administrativos recebem o papel necessário no banco de teste.
  await prisma.usuario.update({ where: { id: usuarioId }, data: { papel: 'ADMIN' } });
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
    await prisma.usuario.update({ where: { id: usuarioId }, data: { papel: 'ADMIN' } });
    const dados = {
      titulo: `Trilha ${randomUUID()}`,
      descricao: 'Introdução à segurança digital',
      ordem: 1,
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
    const semAulas = await request(url).get('/trilhas').set('Cookie', cookie).expect(200);
    expect(semAulas.body.some((item: { id: string }) => item.id === trilha.id)).toBe(false);
    await criarAula(trilha.id);

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
          totalAulas: 1,
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

    const login = await request(url)
      .post('/auth/login')
      .send({
        email: usuario.email.toUpperCase(),
        password: 'Senha123!',
      })
      .expect(200);

    expect(login.headers['set-cookie']).toBeUndefined();

    const token = tokenDoUltimoLink();
    const resposta = await request(url)
      .post('/auth/login/confirmar')
      .send({ token })
      .expect(200);

    expect(resposta.body).toEqual({
      message: 'Login realizado com sucesso!',
      papel: 'USUARIO',
    });

    expect(resposta.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringMatching(
          /^cybereduca_session=.+;.*HttpOnly/,
        ),
      ]),
    );

    await request(url)
      .post('/auth/login/confirmar')
      .send({ token })
      .expect(400);
  });

  it('linkDeLoginExpirado_naoDeveAutenticar', async () => {
    const usuario = await prisma.usuario.findUniqueOrThrow({
      where: { id: usuarioId },
    });

    await request(url)
      .post('/auth/login')
      .send({ email: usuario.email, password: 'Senha123!' })
      .expect(200);

    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { tokenLoginExpiraEm: new Date(Date.now() - 1000) },
    });

    const resposta = await request(url)
      .post('/auth/login/confirmar')
      .send({ token: tokenDoUltimoLink() })
      .expect(400);

    expect(resposta.headers['set-cookie']).toBeUndefined();
  });

  it('recuperacaoDeSenha_deveTrocarASenhaEDerrubarSessoesAntigas', async () => {
    const usuario = await prisma.usuario.findUniqueOrThrow({
      where: { id: usuarioId },
    });

    await request(url)
      .post('/auth/esqueci-senha')
      .send({ email: usuario.email })
      .expect(200);

    const token = tokenDoUltimoLink();

    // O iat do JWT é em segundos; espera para a troca ficar depois do token atual.
    await new Promise((resolve) => setTimeout(resolve, 1100));

    await request(url)
      .post('/auth/redefinir-senha')
      .send({ token, senha: 'NovaSenha1!' })
      .expect(200);

    await request(url).get('/trilhas').set('Cookie', cookie).expect(401);

    await request(url)
      .post('/auth/redefinir-senha')
      .send({ token, senha: 'OutraSenha1!' })
      .expect(400);

    await request(url)
      .post('/auth/login')
      .send({ email: usuario.email, password: 'NovaSenha1!' })
      .expect(200);
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
