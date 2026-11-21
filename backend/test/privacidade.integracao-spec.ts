import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import request from 'supertest';
import { PrismaService } from '../src/prisma.service';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { JwtStrategy } from '../src/auth/jwt.strategy';
import { GoogleAuthGuard } from '../src/auth/google-auth.guard';
import { TERMOS_VERSAO } from '../src/auth/termos';
import { UsuariosController } from '../src/usuarios/usuarios.controller';
import { UsuariosService } from '../src/usuarios/usuarios.service';
import { AdminController } from '../src/admin/admin.controller';
import { AdminService } from '../src/admin/admin.service';
import { AdminUsuariosService } from '../src/admin/admin-usuarios.service';
import { AdminDashboardService } from '../src/admin/admin-dashboard.service';
import { AprendizagemService } from '../src/aprendizagem/aprendizagem.service';
import { ProvasService } from '../src/provas/provas.service';
import { SimulacoesService } from '../src/simulacoes/simulacoes.service';
import { AuditoriaService } from '../src/auditoria.service';
import { AuditoriaContexto } from '../src/auditoria-contexto';
import { AuditoriaInterceptor } from '../src/auditoria.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MailService } from '../src/mail/mail.service';

describe('Privacidade com PostgreSQL real e HTTP', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let googleUser: any;
  const termos = { acceptedTerms: true, termsVersion: TERMOS_VERSAO };
  const cadastro = {
    name: '  Aluno Teste  ',
    email: 'privacidade@example.test',
    password: 'Senha123!',
    ...termos,
  };
  const cookie = (id: string) => `cybereduca_session=${jwt.sign({ sub: id })}`;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'segredo-exclusivo-teste-privacidade';
    process.env.FRONTEND_URL = 'http://localhost:3001';
    const builder = Test.createTestingModule({
      imports: [
        PassportModule.register({}),
        JwtModule.register({ secret: process.env.JWT_SECRET }),
      ],
      controllers: [AuthController, UsuariosController, AdminController],
      providers: [
        PrismaService,
        AuthService,
        UsuariosService,
        AdminUsuariosService,
        JwtStrategy,
        AuditoriaService,
        AuditoriaContexto,
        { provide: APP_INTERCEPTOR, useClass: AuditoriaInterceptor },
        { provide: MailService, useValue: {} },
        ...[
          AdminService,
          AdminDashboardService,
          AprendizagemService,
          ProvasService,
          SimulacoesService,
        ].map((provide) => ({ provide, useValue: {} })),
      ],
    })
      .overrideGuard(GoogleAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          context.switchToHttp().getRequest().user = googleUser;
          return true;
        },
      });
    const module = await builder.compile();
    prisma = module.get(PrismaService);
    jwt = module.get(JwtService);
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    await prisma.usuario.upsert({
      where: { email: 'cybereduca.oficial@gmail.com' },
      create: {
        nome: 'Administrador de Teste',
        email: 'cybereduca.oficial@gmail.com',
        papel: 'ADMIN',
      },
      update: {},
    });
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it('rejeita nomes invalidos e aceite ausente, falso ou de outra versao', async () => {
    for (const name of ['', '   ', 'a', ' a ']) {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...cadastro, name })
        .expect(400);
    }
    for (const acceptedTerms of [undefined, false, 'true', 1]) {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...cadastro, acceptedTerms })
        .expect(400);
    }
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...cadastro, termsVersion: 'antiga' })
      .expect(400);
    expect(
      await prisma.usuario.count({ where: { email: cadastro.email } }),
    ).toBe(0);
  });

  it('registra nome normalizado, versao e data do aceite sem expor credenciais', async () => {
    const antes = new Date();
    const result = await request(app.getHttpServer())
      .post('/auth/register')
      .send(cadastro)
      .expect(201);
    expect(Object.keys(result.body.user).sort()).toEqual([
      'email',
      'id',
      'nome',
    ]);
    const usuario = await prisma.usuario.findUniqueOrThrow({
      where: { id: result.body.user.id },
    });
    expect(usuario.nome).toBe('Aluno Teste');
    expect(usuario.termosVersao).toBe(TERMOS_VERSAO);
    expect(usuario.termosAceitosEm!.getTime()).toBeGreaterThanOrEqual(
      antes.getTime(),
    );
  });

  it('impede acesso antes do aceite Google e libera somente apos salvar o aceite', async () => {
    googleUser = await prisma.usuario.create({
      data: {
        nome: 'Google Teste',
        email: 'google@example.test',
        googleId: 'google-id-teste',
      },
    });
    const callback = await request(app.getHttpServer())
      .get('/auth/google/callback')
      .expect(302);
    expect(callback.headers.location).toBe(
      'http://localhost:3001/aceitar-termos',
    );
    const cookies = callback.headers['set-cookie'] as unknown as string[];
    const pendente = cookies
      .find((item) => item.startsWith('cybereduca_termos_pendentes='))!
      .split(';')[0];
    expect(
      cookies.some(
        (item) =>
          /^cybereduca_session=.+/.test(item) &&
          !item.startsWith('cybereduca_session=;'),
      ),
    ).toBe(false);
    await request(app.getHttpServer())
      .get('/usuarios/me')
      .set('Cookie', pendente)
      .expect(401);
    // Moving a pending token to the session cookie must not bypass the restriction.
    await request(app.getHttpServer())
      .get('/usuarios/me')
      .set(
        'Cookie',
        pendente.replace('cybereduca_termos_pendentes=', 'cybereduca_session='),
      )
      .expect(401);
    await request(app.getHttpServer())
      .post('/auth/termos')
      .send(termos)
      .expect(401);
    await request(app.getHttpServer())
      .post('/auth/termos')
      .set('Cookie', pendente)
      .send({ ...termos, acceptedTerms: false })
      .expect(400);
    const aceite = await request(app.getHttpServer())
      .post('/auth/termos')
      .set('Cookie', pendente)
      .send(termos)
      .expect(201);
    const session = (aceite.headers['set-cookie'] as unknown as string[])
      .find((item) => item.startsWith('cybereduca_session='))!
      .split(';')[0];
    await request(app.getHttpServer())
      .get('/usuarios/me')
      .set('Cookie', session)
      .expect(200);
    googleUser = await prisma.usuario.findUniqueOrThrow({
      where: { id: googleUser.id },
    });
    expect(googleUser.termosVersao).toBe(TERMOS_VERSAO);
    expect(googleUser.termosAceitosEm).toBeInstanceOf(Date);
    const retorno = await request(app.getHttpServer())
      .get('/auth/google/callback')
      .expect(302);
    expect(retorno.headers.location).toBe('http://localhost:3001/dashboard');
  });

  it('protege dados pessoais e edicao administrativa por autenticacao e papel', async () => {
    await request(app.getHttpServer()).get('/usuarios/me').expect(401);
    await request(app.getHttpServer()).get('/admin/usuarios').expect(401);
    const aluno = await prisma.usuario.findUniqueOrThrow({
      where: { email: cadastro.email },
    });
    await request(app.getHttpServer())
      .get('/admin/usuarios')
      .set('Cookie', cookie(aluno.id))
      .expect(403);
    await request(app.getHttpServer())
      .patch(`/admin/usuarios/${aluno.id}`)
      .set('Cookie', cookie(aluno.id))
      .send({ papel: 'ADMIN' })
      .expect(403);
    for (const nome of ['', '  ', 'a', ' a ', null]) {
      await request(app.getHttpServer())
        .patch('/usuarios/me')
        .set('Cookie', cookie(aluno.id))
        .send({ nome })
        .expect(400);
    }
    const admin = await prisma.usuario.findUniqueOrThrow({
      where: { email: 'cybereduca.oficial@gmail.com' },
    });
    for (const nome of ['', '  ', 'a', ' a ', null]) {
      await request(app.getHttpServer())
        .patch(`/admin/usuarios/${aluno.id}`)
        .set('Cookie', cookie(admin.id))
        .send({ nome })
        .expect(400);
    }
    const lista = await request(app.getHttpServer())
      .get('/admin/usuarios')
      .set('Cookie', cookie(admin.id))
      .expect(200);
    expect(lista.body.find((u: any) => u.id === aluno.id).email).toBe(
      'pr***@example.test',
    );
    expect(JSON.stringify(lista.body)).not.toContain('senhaHash');
    await request(app.getHttpServer())
      .patch(`/admin/usuarios/${aluno.id}`)
      .set('Cookie', cookie(admin.id))
      .send({ nome: 'Aluno', papel: 'ADMIN', senhaHash: 'injetado' })
      .expect(200);
    expect(
      (await prisma.usuario.findUniqueOrThrow({ where: { id: aluno.id } }))
        .papel,
    ).toBe('USUARIO');
  });

  it.each(['propria', 'administrativa'])(
    'exclusao %s remove os dados relacionados e invalida a sessao',
    async (modo) => {
      const usuario = await prisma.usuario.create({
        data: { nome: 'Excluir', email: `${modo}@example.test` },
      });
      const outro = await prisma.usuario.findUniqueOrThrow({
        where: { email: cadastro.email },
      });
      const trilha = await prisma.trilha.create({
        data: { titulo: modo, descricao: 'Teste', ordem: 999 },
      });
      const aula = await prisma.aula.create({
        data: { titulo: 'Teste', ordem: 1, trilhaId: trilha.id },
      });
      const quiz = await prisma.quiz.create({
        data: { titulo: 'Teste', descricao: '', aulaId: aula.id },
      });
      const questao = await prisma.questaoQuiz.create({
        data: { quizId: quiz.id, enunciado: 'Teste', explicacao: '', ordem: 1 },
      });
      const alternativa = await prisma.alternativaQuiz.create({
        data: { questaoId: questao.id, texto: 'Teste', ordem: 1 },
      });
      const tentativa = await prisma.tentativaQuiz.create({
        data: {
          usuarioId: usuario.id,
          quizId: quiz.id,
          totalQuestoes: 1,
          totalAcertos: 1,
          respostas: {
            create: {
              questaoId: questao.id,
              alternativaId: alternativa.id,
              acertou: true,
            },
          },
        },
      });
      await prisma.progressoAula.create({
        data: { usuarioId: usuario.id, aulaId: aula.id },
      });
      await prisma.progressoAula.create({
        data: { usuarioId: outro.id, aulaId: aula.id },
      });
      await prisma.consultaSeguranca.create({
        data: {
          usuarioId: usuario.id,
          dominio: 'example.test',
          resultado: 'SEM_DADOS',
        },
      });
      const cenario = await prisma.cenarioPhishing.create({
        data: {
          aulaId: aula.id,
          titulo: 'Teste',
          descricao: '',
          conteudoMensagem: '',
          tipo: 'EMAIL',
          ehPhishing: true,
          explicacao: '',
        },
      });
      await prisma.tentativaPhishing.create({
        data: {
          usuarioId: usuario.id,
          cenarioId: cenario.id,
          respostaEhPhishing: true,
          acertou: true,
        },
      });
      const prova = await prisma.prova.create({
        data: { trilhaId: trilha.id, titulo: 'Teste' },
      });
      const qp = await prisma.questaoProva.create({
        data: { provaId: prova.id, enunciado: 'Teste' },
      });
      const ap = await prisma.alternativaProva.create({
        data: { questaoId: qp.id, texto: 'Teste' },
      });
      const tp = await prisma.tentativaProva.create({
        data: {
          usuarioId: usuario.id,
          provaId: prova.id,
          respostas: {
            create: { questaoId: qp.id, alternativaId: ap.id, acertou: true },
          },
        },
      });
      await prisma.resultadoProva.create({
        data: {
          usuarioId: usuario.id,
          provaId: prova.id,
          acertos: 1,
          totalQuestoes: 1,
        },
      });
      const categoria = await prisma.categoriaSimulacao.create({
        data: { nome: modo, descricao: '' },
      });
      const simulacao = await prisma.simulacao.create({
        data: { titulo: 'Teste', descricao: '', categoriaId: categoria.id },
      });
      await prisma.resultadoSimulacao.create({
        data: {
          usuarioId: usuario.id,
          simulacaoId: simulacao.id,
          acertos: 1,
          totalQuestoes: 1,
        },
      });
      await prisma.logAuditoria.createMany({
        data: [
          { atorId: usuario.id, acao: 'LOGIN', entidade: 'Usuario' },
          { entidadeId: usuario.id, acao: 'ATUALIZAR', entidade: 'Usuario' },
          {
            acao: 'LOGIN_FALHOU',
            entidade: 'Usuario',
            detalhes: { emailInformado: usuario.email },
          },
        ],
      });
      const sessao = cookie(usuario.id);
      if (modo === 'propria') {
        await request(app.getHttpServer())
          .delete('/usuarios/me')
          .set('Cookie', sessao)
          .send({ confirmacao: 'incorreta' })
          .expect(400);
        const result = await request(app.getHttpServer())
          .delete('/usuarios/me')
          .set('Cookie', sessao)
          .send({ confirmacao: 'excluir' })
          .expect(200);
        expect(
          (result.headers['set-cookie'] as unknown as string[]).join(),
        ).toContain('cybereduca_session=;');
      } else {
        const admin = await prisma.usuario.findUniqueOrThrow({
          where: { email: 'cybereduca.oficial@gmail.com' },
        });
        await request(app.getHttpServer())
          .delete(`/admin/usuarios/${usuario.id}`)
          .set('Cookie', cookie(admin.id))
          .expect(200);
      }
      expect(
        await prisma.usuario.findUnique({ where: { id: usuario.id } }),
      ).toBeNull();
      for (const model of [
        prisma.progressoAula,
        prisma.consultaSeguranca,
        prisma.tentativaQuiz,
        prisma.tentativaPhishing,
        prisma.tentativaProva,
        prisma.resultadoProva,
        prisma.resultadoSimulacao,
      ] as any[]) {
        expect(await model.count({ where: { usuarioId: usuario.id } })).toBe(0);
      }
      expect(
        await prisma.respostaQuiz.count({
          where: { tentativaId: tentativa.id },
        }),
      ).toBe(0);
      expect(
        await prisma.respostaProva.count({ where: { tentativaId: tp.id } }),
      ).toBe(0);
      expect(
        await prisma.logAuditoria.count({
          where: {
            OR: [
              { atorId: usuario.id },
              { entidadeId: usuario.id },
              { detalhes: { path: ['emailInformado'], equals: usuario.email } },
            ],
          },
        }),
      ).toBe(0);
      expect(
        await prisma.progressoAula.count({
          where: { usuarioId: outro.id, aulaId: aula.id },
        }),
      ).toBe(1);
      await request(app.getHttpServer())
        .get('/usuarios/me')
        .set('Cookie', sessao)
        .expect(401);
    },
  );

  it('reverte a limpeza de auditoria e preserva a conta se a exclusao falhar no PostgreSQL', async () => {
    const usuario = await prisma.usuario.create({
      data: { nome: 'Rollback', email: 'rollback@example.test' },
    });
    const log = await prisma.logAuditoria.create({
      data: { atorId: usuario.id, entidade: 'Usuario', acao: 'LOGIN' },
    });
    // A test-only trigger forces a real database failure after audit cleanup.
    await prisma.$executeRawUnsafe(
      `CREATE FUNCTION falhar_exclusao_teste() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Falha de teste'; END $$`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE TRIGGER falhar_exclusao_teste BEFORE DELETE ON "Usuario" FOR EACH ROW WHEN (OLD.email = 'rollback@example.test') EXECUTE FUNCTION falhar_exclusao_teste()`,
    );
    try {
      await expect(
        app.get(AdminUsuariosService).excluirUsuario(usuario.id),
      ).rejects.toThrow();
      expect(
        await prisma.usuario.findUnique({ where: { id: usuario.id } }),
      ).not.toBeNull();
      expect(
        await prisma.logAuditoria.findUnique({ where: { id: log.id } }),
      ).not.toBeNull();
    } finally {
      await prisma.$executeRawUnsafe(
        'DROP TRIGGER falhar_exclusao_teste ON "Usuario"',
      );
      await prisma.$executeRawUnsafe('DROP FUNCTION falhar_exclusao_teste()');
    }
  });
});
