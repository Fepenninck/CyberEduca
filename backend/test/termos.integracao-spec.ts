import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import request from 'supertest';
import { PrismaService } from '../src/prisma.service';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { JwtStrategy } from '../src/auth/jwt.strategy';
import { AuditoriaService } from '../src/auditoria.service';
import { MailService } from '../src/mail/mail.service';
import { TermosService } from '../src/termos/termos.service';
import { TermosModule } from '../src/termos/termos.module';

describe('Publicacao administrativa dos Termos de Uso', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let adminCookie: string;
  let alunoCookie: string;
  let alunoId: string;
  let initial: { termsVersion: string; conteudo: string };
  const suffix = randomUUID();
  const prefix = `test-${suffix}`;
  const version = `${prefix}-v2`;
  const content =
    '## Termos atualizados\n\nConteudo publicado pelo administrador para este teste.';

  beforeAll(async () => {
    process.env.JWT_SECRET = 'segredo-exclusivo-termos-integracao';
    const module = await Test.createTestingModule({
      imports: [
        TermosModule,
        PassportModule.register({}),
        JwtModule.register({ secret: process.env.JWT_SECRET }),
      ],
      controllers: [AuthController],
      providers: [
        PrismaService,
        JwtStrategy,
        AuthService,
        { provide: AuditoriaService, useValue: { registrar: async () => {} } },
        { provide: MailService, useValue: {} },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    prisma = module.get(PrismaService);
    jwt = module.get(JwtService);
    initial = await module.get(TermosService).atuais();
    const admin = await prisma.usuario.upsert({
      where: { email: 'cybereduca.oficial@gmail.com' },
      create: {
        nome: 'Administrador',
        email: 'cybereduca.oficial@gmail.com',
        papel: 'ADMIN',
      },
      update: {},
    });
    const aluno = await prisma.usuario.create({
      data: {
        nome: 'Aluno Termos',
        email: `${suffix}@example.test`,
        termosVersao: initial.termsVersion,
        termosAceitosEm: new Date(),
      },
    });
    alunoId = aluno.id;
    adminCookie = `cybereduca_session=${jwt.sign({ sub: admin.id })}`;
    alunoCookie = `cybereduca_session=${jwt.sign({ sub: aluno.id })}`;
  });

  afterAll(async () => {
    // Restore only records created by this suite so other integration suites are independent.
    if (prisma) {
      await prisma.politicaPrivacidade.deleteMany({
        where: { versao: { startsWith: prefix } },
      });
      await prisma.termosUso.deleteMany({
        where: { versao: { startsWith: prefix } },
      });
      await prisma.usuario.deleteMany({
        where: { email: { endsWith: `${suffix}@example.test` } },
      });
    }
    await app?.close();
    await prisma?.$disconnect();
  });

  it('separa a politica de privacidade dos termos, protegendo a edicao e preservando aceites', async () => {
    const server = app.getHttpServer();
    const politica = await request(server)
      .get('/politicas/privacidade')
      .expect(200);
    expect(politica.headers['cache-control']).toBe('no-store');
    expect(politica.body.conteudo.match(/^## /gm)).toHaveLength(13);
    await request(server).get('/admin/privacidade').expect(401);
    await request(server).post('/admin/privacidade').send({}).expect(401);
    await request(server)
      .get('/admin/privacidade')
      .set('Cookie', alunoCookie)
      .expect(403);
    const data = {
      versao: version,
      conteudo:
        '## Privacidade atualizada\n\nTexto para teste da politica independente.',
      versaoAnterior: politica.body.version,
    };
    await request(server)
      .post('/admin/privacidade')
      .set('Cookie', alunoCookie)
      .send(data)
      .expect(403);
    await request(server)
      .post('/admin/privacidade')
      .set('Cookie', adminCookie)
      .send({ ...data, versao: ' ' })
      .expect(400);
    const termosAntes = await prisma.termosUso.findFirstOrThrow({
      orderBy: { id: 'desc' },
    });
    const usuarioAntes = await prisma.usuario.findUniqueOrThrow({
      where: { id: alunoId },
    });
    await request(server)
      .post('/admin/privacidade')
      .set('Cookie', adminCookie)
      .send(data)
      .expect(201);
    const publicada = await request(server)
      .get('/politicas/privacidade')
      .expect(200);
    expect(publicada.body).toMatchObject({ version, conteudo: data.conteudo });
    expect(
      await prisma.termosUso.findFirst({ orderBy: { id: 'desc' } }),
    ).toEqual(termosAntes);
    expect(
      (await prisma.usuario.findUniqueOrThrow({ where: { id: alunoId } }))
        .termosAceitosEm,
    ).toEqual(usuarioAntes.termosAceitosEm);
    expect(
      (await prisma.usuario.findUniqueOrThrow({ where: { id: alunoId } }))
        .termosVersao,
    ).toBe(usuarioAntes.termosVersao);
    await request(server)
      .post('/admin/privacidade')
      .set('Cookie', adminCookie)
      .send({ ...data, versaoAnterior: version })
      .expect(409);
    expect(
      (
        await prisma.politicaPrivacidade.findUniqueOrThrow({
          where: { versao: politica.body.version },
        })
      ).conteudo,
    ).toBe(politica.body.conteudo);
    const historico = await request(server)
      .get('/admin/privacidade')
      .set('Cookie', adminCookie)
      .expect(200);
    expect(historico.body.historico[0].versao).toBe(version);
  });

  it('publica somente leitura sem cache para visitantes e bloqueia escrita sem permissao', async () => {
    const publico = await request(app.getHttpServer())
      .get('/auth/termos')
      .expect(200);
    expect(publico.body).toMatchObject({
      termsVersion: initial.termsVersion,
      conteudo: initial.conteudo,
    });
    expect(publico.headers['cache-control']).toBe('no-store');
    await request(app.getHttpServer()).get('/admin/termos').expect(401);
    await request(app.getHttpServer())
      .post('/admin/termos')
      .send({})
      .expect(401);
    await request(app.getHttpServer())
      .get('/admin/termos')
      .set('Cookie', alunoCookie)
      .expect(403);
    await request(app.getHttpServer())
      .post('/admin/termos')
      .set('Cookie', alunoCookie)
      .send({
        versao: version,
        conteudo: content,
        versaoAnterior: initial.termsVersion,
      })
      .expect(403);
  });

  it('valida versao e conteudo e rejeita formulario administrativo desatualizado', async () => {
    const data = {
      versao: version,
      conteudo: content,
      versaoAnterior: initial.termsVersion,
    };
    for (const versao of [
      '',
      '   ',
      'com espacos',
      '<script>',
      'a'.repeat(51),
    ]) {
      await request(app.getHttpServer())
        .post('/admin/termos')
        .set('Cookie', adminCookie)
        .send({ ...data, versao })
        .expect(400);
    }
    for (const conteudo of ['', '  ', 'Curto']) {
      await request(app.getHttpServer())
        .post('/admin/termos')
        .set('Cookie', adminCookie)
        .send({ ...data, conteudo })
        .expect(400);
    }
    await request(app.getHttpServer())
      .post('/admin/termos')
      .set('Cookie', adminCookie)
      .send({ ...data, versaoAnterior: 'formulario-antigo' })
      .expect(409);
  });

  it('publica a versao digitada e preserva o texto anteriormente aceito', async () => {
    await request(app.getHttpServer())
      .post('/admin/termos')
      .set('Cookie', adminCookie)
      .send({
        versao: ` ${version} `,
        conteudo: ` ${content} `,
        versaoAnterior: initial.termsVersion,
      })
      .expect(201);
    const atual = await request(app.getHttpServer())
      .get('/auth/termos')
      .expect(200);
    expect(atual.body).toMatchObject({
      termsVersion: version,
      conteudo: content,
    });
    expect(
      (
        await prisma.termosUso.findUniqueOrThrow({
          where: { versao: initial.termsVersion },
        })
      ).conteudo,
    ).toBe(initial.conteudo);
    expect(
      (await prisma.usuario.findUniqueOrThrow({ where: { id: alunoId } }))
        .termosVersao,
    ).toBe(initial.termsVersion);
    const admin = await request(app.getHttpServer())
      .get('/admin/termos')
      .set('Cookie', adminCookie)
      .expect(200);
    expect(
      admin.body.historico.map((item: { versao: string }) => item.versao),
    ).toContain(initial.termsVersion);
    expect(admin.body.historico[0].versao).toBe(version);
  });

  it('cadastro usa a versao publicada e recusa o aceite de uma versao antiga', async () => {
    const data = {
      name: 'Cadastro Termos',
      email: `cadastro-${suffix}@example.test`,
      password: 'Senha123!',
      acceptedTerms: true,
    };
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...data, termsVersion: initial.termsVersion })
      .expect(400);
    const result = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...data, termsVersion: version })
      .expect(201);
    const usuario = await prisma.usuario.findUniqueOrThrow({
      where: { id: result.body.user.id },
    });
    expect(usuario.termosVersao).toBe(version);
    expect(usuario.termosAceitosEm).toBeInstanceOf(Date);
  });

  it('aceite Google tambem usa a versao publicada e nao aceita texto obsoleto', async () => {
    const token = jwt.sign(
      { sub: alunoId, purpose: 'aceite-termos' },
      { audience: 'aceite-termos', expiresIn: '10m' },
    );
    const pending = `cybereduca_termos_pendentes=${token}`;
    await request(app.getHttpServer())
      .post('/auth/termos')
      .set('Cookie', pending)
      .send({ acceptedTerms: true, termsVersion: initial.termsVersion })
      .expect(400);
    await request(app.getHttpServer())
      .post('/auth/termos')
      .set('Cookie', pending)
      .send({ acceptedTerms: true, termsVersion: version })
      .expect(201);
    expect(
      (await prisma.usuario.findUniqueOrThrow({ where: { id: alunoId } }))
        .termosVersao,
    ).toBe(version);
  });

  it('nao permite reescrever nem reutilizar uma versao publicada', async () => {
    for (const versao of [version, initial.termsVersion]) {
      await request(app.getHttpServer())
        .post('/admin/termos')
        .set('Cookie', adminCookie)
        .send({
          versao,
          conteudo: 'Texto diferente para reescrever os termos.',
          versaoAnterior: version,
        })
        .expect(409);
    }
    expect(
      (await prisma.termosUso.findUniqueOrThrow({ where: { versao: version } }))
        .conteudo,
    ).toBe(content);
  });

  it('resolve publicacoes simultaneas sem perder alteracoes de outro administrador', async () => {
    const resultados = await Promise.all(
      ['a', 'b'].map((qual) =>
        request(app.getHttpServer())
          .post('/admin/termos')
          .set('Cookie', adminCookie)
          .send({
            versao: `${prefix}-${qual}`,
            conteudo: content,
            versaoAnterior: version,
          }),
      ),
    );
    expect(resultados.map((result) => result.status).sort()).toEqual([
      201, 409,
    ]);
  });
});
