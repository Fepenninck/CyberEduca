import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { randomUUID } from 'node:crypto';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import request from 'supertest';

import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { JwtStrategy } from '../src/auth/jwt.strategy';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { AdminQuizzesController, QuizzesController } from '../src/quizzes/quizzes.controller';
import { QuizzesService } from '../src/quizzes/quizzes.service';
import { PhishingController } from '../src/phishing/phishing.controller';
import { PhishingService } from '../src/phishing/phishing.service';
import { UsuariosController } from '../src/usuarios/usuarios.controller';
import { UsuariosService } from '../src/usuarios/usuarios.service';
import { PrismaService } from '../src/prisma.service';
import { AuditoriaService } from '../src/auditoria.service';

describe('Integração HTTP de quizzes, simulador de phishing e perfil', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let url: string;
  let cookie: string;

  let quizId: string;
  let questaoId: string;
  let alternativaCorretaId: string;
  let alternativaErradaId: string;
  let cenarioId: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'segredo-exclusivo-dos-testes-locais';

    const modulo = await Test.createTestingModule({
      imports: [PassportModule.register({}), JwtModule.register({ secret: process.env.JWT_SECRET })],
      controllers: [AuthController, QuizzesController, AdminQuizzesController, PhishingController, UsuariosController],
      providers: [AuthService, JwtStrategy, JwtAuthGuard, QuizzesService, PhishingService, UsuariosService, PrismaService, AuditoriaService],
    }).compile();

    app = modulo.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(0, '127.0.0.1');
    url = await app.getUrl();
    prisma = app.get(PrismaService);

    // Conteúdo publicado criado direto no banco de teste.
    const trilha = await prisma.trilha.create({
      data: { titulo: `Trilha ${randomUUID()}`, descricao: 'Fundamentos', ordem: 900 + Math.floor(Math.random() * 1000) },
    });
    const aula = await prisma.aula.create({
      data: { titulo: 'Senhas fortes', conteudo: 'Use senhas longas e únicas.', ordem: 1, trilhaId: trilha.id },
    });
    const quiz = await prisma.quiz.create({
      data: {
        titulo: 'Quiz de senhas',
        descricao: 'Revisão da aula',
        aulaId: aula.id,
        status: 'PUBLICADO',
        questoes: {
          create: [{
            enunciado: 'Qual senha é mais segura?',
            explicacao: 'Senhas longas e únicas resistem melhor a ataques.',
            ordem: 1,
            alternativas: {
              create: [
                { texto: 'Uma frase longa e exclusiva', correta: true, ordem: 1 },
                { texto: 'A data de nascimento', correta: false, ordem: 2 },
              ],
            },
          }],
        },
      },
      include: { questoes: { include: { alternativas: true } } },
    });
    quizId = quiz.id;
    questaoId = quiz.questoes[0].id;
    alternativaCorretaId = quiz.questoes[0].alternativas.find((item) => item.correta)!.id;
    alternativaErradaId = quiz.questoes[0].alternativas.find((item) => !item.correta)!.id;

    const cenario = await prisma.cenarioPhishing.create({
      data: {
        titulo: 'Entrega pendente',
        descricao: 'SMS sobre uma encomenda',
        conteudoMensagem: 'Sua encomenda foi retida. Pague a taxa em link-estranho.com',
        tipo: 'SMS',
        ehPhishing: true,
        explicacao: 'Cobrança inesperada com link desconhecido é um sinal clássico de golpe.',
        aulaId: aula.id,
        status: 'PUBLICADO',
      },
    });
    cenarioId = cenario.id;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    const email = `${randomUUID()}@cybereduca.test`;
    await request(url).post('/auth/register').send({ name: 'Aluno de integração', email, password: 'Senha123!' }).expect(201);
    const login = await request(url).post('/auth/login').send({ email, password: 'Senha123!' }).expect(200);
    cookie = login.headers['set-cookie'][0].split(';')[0];
  });

  it('listarQuizzes_alunoLogado_deveMostrarQuizPublicadoSemGabarito', async () => {
    const lista = await request(url).get('/quizzes').set('Cookie', cookie).expect(200);
    expect(lista.body.some((item: { id: string }) => item.id === quizId)).toBe(true);

    const detalhe = await request(url).get(`/quizzes/${quizId}`).set('Cookie', cookie).expect(200);
    expect(detalhe.body.questoes[0].alternativas).toHaveLength(2);
    expect(JSON.stringify(detalhe.body.questoes)).not.toContain('correta');
  });

  it('responderQuiz_comRespostaCorreta_deveRetornar201EPersistirTentativa', async () => {
    const resposta = await request(url)
      .post(`/quizzes/${quizId}/tentativas`)
      .set('Cookie', cookie)
      .send({ respostas: [{ questaoId, alternativaId: alternativaCorretaId }] })
      .expect(201);

    expect(resposta.body).toMatchObject({ quizId, totalQuestoes: 1, totalAcertos: 1, concluido: true });
    const salva = await prisma.tentativaQuiz.findUnique({ where: { id: resposta.body.tentativaId } });
    expect(salva).toMatchObject({ totalAcertos: 1, totalQuestoes: 1 });
  });

  it('responderQuiz_duasVezes_deveRetornar409', async () => {
    const corpo = { respostas: [{ questaoId, alternativaId: alternativaErradaId }] };
    await request(url).post(`/quizzes/${quizId}/tentativas`).set('Cookie', cookie).send(corpo).expect(201);
    const repetida = await request(url).post(`/quizzes/${quizId}/tentativas`).set('Cookie', cookie).send(corpo).expect(409);
    expect(repetida.body.message).toContain('Atividade já concluída');
  });

  it('responderQuiz_comDadosInvalidosOuSemSessao_deveRecusar', async () => {
    await request(url).post(`/quizzes/${quizId}/tentativas`).set('Cookie', cookie).send({ respostas: [] }).expect(400);
    await request(url).get('/quizzes/nao-e-uuid').set('Cookie', cookie).expect(400);
    await request(url).get(`/quizzes/${randomUUID()}`).set('Cookie', cookie).expect(404);
    await request(url).get('/quizzes').expect(401);
  });

  it('rotaAdministrativa_comAluno_deveRetornar403', async () => {
    await request(url).get('/admin/quizzes').set('Cookie', cookie).expect(403);
  });

  it('responderCenario_deveCorrigirExplicarEImpedirNovaTentativa', async () => {
    const resposta = await request(url)
      .post(`/phishing/cenarios/${cenarioId}/tentativas`)
      .set('Cookie', cookie)
      .send({ respostaEhPhishing: true })
      .expect(201);

    expect(resposta.body).toMatchObject({ cenarioId, acertou: true, concluido: true });
    expect(resposta.body.explicacao).toContain('golpe');

    const detalhe = await request(url).get(`/phishing/cenarios/${cenarioId}`).set('Cookie', cookie).expect(200);
    expect(detalhe.body.resultado).toMatchObject({ acertou: true });
    await request(url).post(`/phishing/cenarios/${cenarioId}/tentativas`).set('Cookie', cookie).send({ respostaEhPhishing: false }).expect(409);
  });

  it('responderCenario_semBooleano_deveRetornar400', async () => {
    await request(url).post(`/phishing/cenarios/${cenarioId}/tentativas`).set('Cookie', cookie).send({ respostaEhPhishing: 'sim' }).expect(400);
  });

  it('atualizarAvatar_comOpcaoValida_deveRetornar200EPersistir', async () => {
    const resposta = await request(url).patch('/usuarios/me').set('Cookie', cookie).send({ avatar: 'escudo' }).expect(200);
    expect(resposta.body.avatar).toBe('escudo');

    const perfil = await request(url).get('/usuarios/me').set('Cookie', cookie).expect(200);
    expect(perfil.body.avatar).toBe('escudo');
    expect(perfil.body.senhaHash).toBeUndefined();

    await request(url).patch('/usuarios/me').set('Cookie', cookie).send({ avatar: 'dragao' }).expect(400);
  });

  it('desempenho_deveRefletirQuizzesESimulacoesDoAluno', async () => {
    await request(url).post(`/quizzes/${quizId}/tentativas`).set('Cookie', cookie)
      .send({ respostas: [{ questaoId, alternativaId: alternativaCorretaId }] }).expect(201);
    await request(url).post(`/phishing/cenarios/${cenarioId}/tentativas`).set('Cookie', cookie)
      .send({ respostaEhPhishing: false }).expect(201);

    const resposta = await request(url).get('/usuarios/me/desempenho').set('Cookie', cookie).expect(200);
    expect(resposta.body.quizzes).toMatchObject({ feitos: 1, media: 100, melhor: { quizId, percentual: 100 } });
    expect(resposta.body.phishing).toEqual({ respondidos: 1, acertos: 0, porTipo: [{ tipo: 'SMS', total: 1, acertos: 0 }] });
    expect(resposta.body.ritmo.semana).toHaveLength(7);
  });
});
