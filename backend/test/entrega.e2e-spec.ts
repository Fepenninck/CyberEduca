import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { VirusTotalService } from '../src/consulta-seguranca/virustotal.service';

describe('Entrega: contratos integrados e persistência', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let admin: string,
    aluno: string,
    alunoId: string,
    aulaId: string,
    trilhaId: string;
  let quizId: string,
    questaoId: string,
    alternativaId: string,
    cenarioId: string,
    provaId: string;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = mod.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    prisma = app.get(PrismaService);
    const administrador = await prisma.usuario.create({
      data: {
        nome: 'Admin integração',
        email: `${randomUUID()}@integration.test`,
        papel: 'ADMIN',
      },
    });
    const usuario = await prisma.usuario.create({
      data: {
        nome: 'Aluno integração',
        email: `${randomUUID()}@integration.test`,
      },
    });
    alunoId = usuario.id;
    const jwt = app.get(JwtService);
    admin = `cybereduca_session=${jwt.sign({ sub: administrador.id })}`;
    aluno = `cybereduca_session=${jwt.sign({ sub: usuario.id })}`;
    const trilha = await prisma.trilha.create({
      data: {
        titulo: 'Integração',
        descricao: 'Teste',
        ordem: 1,
        aulas: { create: { titulo: 'Aula integrada', ordem: 1 } },
      },
      include: { aulas: true },
    });
    trilhaId = trilha.id;
    aulaId = trilha.aulas[0].id;
  });
  afterAll(async () => {
    if (app) await app.close();
  });

  it('bloqueia alunos e sessões ausentes nas APIs administrativas', async () => {
    await request(app.getHttpServer()).get('/admin/quizzes').expect(401);
    for (const url of [
      '/admin/quizzes',
      '/admin/phishing/cenarios',
      '/admin/provas',
      '/admin/relatorios',
      `/admin/desempenho/usuarios/${alunoId}`,
    ]) {
      await request(app.getHttpServer())
        .get(url)
        .set('Cookie', aluno)
        .expect(403);
    }
  });
  it('cadastra questões e alternativas de quiz e valida a publicação', async () => {
    const quiz = await request(app.getHttpServer())
      .post('/admin/quizzes')
      .set('Cookie', admin)
      .send({ titulo: 'Quiz', descricao: 'Descrição', aulaId })
      .expect(201);
    quizId = quiz.body.id;
    await request(app.getHttpServer())
      .patch(`/admin/quizzes/${quizId}/status`)
      .set('Cookie', admin)
      .send({ status: 'PUBLICADO' })
      .expect(400);
    const questao = await request(app.getHttpServer())
      .post(`/admin/quizzes/${quizId}/questoes`)
      .set('Cookie', admin)
      .send({
        enunciado: 'É seguro?',
        explicacao: 'Verifique o remetente.',
        ordem: 1,
      })
      .expect(201);
    questaoId = questao.body.id;
    const correta = await request(app.getHttpServer())
      .post(`/admin/quizzes/${quizId}/questoes/${questaoId}/alternativas`)
      .set('Cookie', admin)
      .send({ texto: 'Não', correta: true, ordem: 1 })
      .expect(201);
    alternativaId = correta.body.id;
    await request(app.getHttpServer())
      .post(`/admin/quizzes/${quizId}/questoes/${questaoId}/alternativas`)
      .set('Cookie', admin)
      .send({ texto: 'Sim', correta: false, ordem: 2 })
      .expect(201);
    await request(app.getHttpServer())
      .patch(`/admin/quizzes/${quizId}/status`)
      .set('Cookie', admin)
      .send({ status: 'PUBLICADO' })
      .expect(200);
    const detalhe = await request(app.getHttpServer())
      .get(`/quizzes/${quizId}`)
      .set('Cookie', aluno)
      .expect(200);
    expect(JSON.stringify(detalhe.body)).not.toContain('correta');
    expect(detalhe.body.questoes[0]).not.toHaveProperty('explicacao');
  });
  it('salva tentativas no aluno correto, sem modificar o progresso das aulas', async () => {
    const retorno = await request(app.getHttpServer())
      .post(`/quizzes/${quizId}/tentativas`)
      .set('Cookie', aluno)
      .send({ respostas: [{ questaoId, alternativaId }] })
      .expect(201);
    expect(retorno.body).toMatchObject({
      totalAcertos: 1,
      concluido: true,
      progressoAtualizado: false,
    });
    const tentativa = await prisma.tentativaQuiz.findUniqueOrThrow({
      where: { id: retorno.body.tentativaId },
      include: { respostas: true },
    });
    expect(tentativa.usuarioId).toBe(alunoId);
    expect(tentativa.respostas).toHaveLength(1);
    expect(
      await prisma.progressoAula.count({ where: { usuarioId: alunoId } }),
    ).toBe(0);
    await request(app.getHttpServer())
      .post(`/quizzes/${quizId}/tentativas`)
      .set('Cookie', aluno)
      .send({ respostas: [{ questaoId, alternativaId: randomUUID() }] })
      .expect(400);
  });
  it('permite retornar a rascunho para editar sem apagar tentativas', async () => {
    await request(app.getHttpServer())
      .patch(`/admin/quizzes/${quizId}/status`)
      .set('Cookie', admin)
      .send({ status: 'RASCUNHO' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/admin/quizzes/${quizId}`)
      .set('Cookie', admin)
      .send({ titulo: 'Quiz editado' })
      .expect(200);
    expect(await prisma.tentativaQuiz.count({ where: { quizId } })).toBe(1);
  });
  it('publica phishing e registra acertos e erros sem expor o gabarito', async () => {
    const criado = await request(app.getHttpServer())
      .post('/admin/phishing/cenarios')
      .set('Cookie', admin)
      .send({
        titulo: 'Mensagem',
        descricao: 'Analise',
        conteudoMensagem: 'Clique para atualizar sua senha',
        tipo: 'EMAIL',
        ehPhishing: true,
        explicacao: 'Solicitação suspeita.',
        aulaId,
      })
      .expect(201);
    cenarioId = criado.body.id;
    await request(app.getHttpServer())
      .patch(`/admin/phishing/cenarios/${cenarioId}/status`)
      .set('Cookie', admin)
      .send({ status: 'PUBLICADO' })
      .expect(200);
    const detalhe = await request(app.getHttpServer())
      .get(`/phishing/cenarios/${cenarioId}`)
      .set('Cookie', aluno)
      .expect(200);
    expect(detalhe.body).not.toHaveProperty('ehPhishing');
    expect(detalhe.body).not.toHaveProperty('explicacao');
    for (const respostaEhPhishing of [true, false]) {
      const resposta = await request(app.getHttpServer())
        .post(`/phishing/cenarios/${cenarioId}/tentativas`)
        .set('Cookie', aluno)
        .send({ respostaEhPhishing })
        .expect(201);
      expect(resposta.body.acertou).toBe(respostaEhPhishing);
      expect(resposta.body.progressoAtualizado).toBe(false);
    }
    expect(
      await prisma.tentativaPhishing.count({
        where: { usuarioId: alunoId, cenarioId },
      }),
    ).toBe(2);
    await request(app.getHttpServer())
      .patch(`/admin/phishing/cenarios/${cenarioId}/status`)
      .set('Cookie', admin)
      .send({ status: 'RASCUNHO' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/admin/phishing/cenarios/${cenarioId}`)
      .set('Cookie', admin)
      .send({ titulo: 'Mensagem editada' })
      .expect(200);
  });
  it('integra painel de provas com notas, respostas dissertativas e ambos os status publicados', async () => {
    const criada = await request(app.getHttpServer())
      .post('/admin/provas')
      .set('Cookie', admin)
      .send({
        titulo: 'Prova integrada',
        descricao: 'Teste',
        trilhaId,
        questoes: [
          {
            enunciado: 'Objetiva',
            tipo: 'MULTIPLA_ESCOLHA',
            alternativas: [
              { texto: 'Certa', isCorreta: true },
              { texto: 'Errada', isCorreta: false },
            ],
          },
          { enunciado: 'Explique', tipo: 'DISSERTATIVA' },
        ],
      })
      .expect(201);
    provaId = criada.body.id;
    await request(app.getHttpServer())
      .patch(`/admin/provas/${provaId}/status`)
      .set('Cookie', admin)
      .send({ status: 'PUBLICADO' })
      .expect(200);
    const detalhe = await request(app.getHttpServer())
      .get(`/provas/${provaId}`)
      .set('Cookie', aluno)
      .expect(200);
    expect(JSON.stringify(detalhe.body)).not.toContain('isCorreta');
    const objetiva = criada.body.questoes.find(
      (q: { tipo: string }) => q.tipo === 'MULTIPLA_ESCOLHA',
    );
    const dissertativa = criada.body.questoes.find(
      (q: { tipo: string }) => q.tipo === 'DISSERTATIVA',
    );
    const respostas = [
      {
        questaoId: objetiva.id,
        alternativaId: objetiva.alternativas.find(
          (a: { isCorreta: boolean }) => a.isCorreta,
        ).id,
      },
      {
        questaoId: dissertativa.id,
        respostaTexto: 'Conferir remetente e domínio.',
      },
    ];
    const retorno = await request(app.getHttpServer())
      .post(`/provas/${provaId}/tentativas`)
      .set('Cookie', aluno)
      .send({ respostas, nota: 0 })
      .expect(201);
    expect(retorno.body).toMatchObject({
      nota: 10,
      totalAcertos: 1,
      totalQuestoes: 1,
      concluido: true,
    });
    const tentativa = await prisma.tentativaProva.findUniqueOrThrow({
      where: { id: retorno.body.tentativaId },
      include: { respostas: true },
    });
    expect(tentativa.usuarioId).toBe(alunoId);
    expect(
      tentativa.respostas.find((r) => r.avaliacaoManual)?.respostaTexto,
    ).toBe('Conferir remetente e domínio.');
    await request(app.getHttpServer())
      .post(`/provas/${provaId}/tentativas`)
      .set('Cookie', aluno)
      .send({ respostas: [respostas[0], respostas[0]] })
      .expect(400);
  });
  it('aceita o contrato de criação incremental de questões e alternativas do Thiago', async () => {
    const criada = await request(app.getHttpServer())
      .post('/admin/provas')
      .set('Cookie', admin)
      .send({ titulo: 'Incremental', descricao: '', trilhaId })
      .expect(201);
    const questao = await request(app.getHttpServer())
      .post(`/admin/provas/${criada.body.id}/questoes`)
      .set('Cookie', admin)
      .send({ enunciado: 'Pergunta', ordem: 1 })
      .expect(201);
    await request(app.getHttpServer())
      .post(
        `/admin/provas/${criada.body.id}/questoes/${questao.body.id}/alternativas`,
      )
      .set('Cookie', admin)
      .send({ texto: 'Correta', correta: true, ordem: 1 })
      .expect(201);
    await request(app.getHttpServer())
      .post(
        `/admin/provas/${criada.body.id}/questoes/${questao.body.id}/alternativas`,
      )
      .set('Cookie', admin)
      .send({ texto: 'Incorreta', correta: false, ordem: 2 })
      .expect(201);
    await request(app.getHttpServer())
      .patch(`/admin/provas/${criada.body.id}/status`)
      .set('Cookie', admin)
      .send({ status: 'PUBLICADA' })
      .expect(200);
  });
  it('preserva correção e conclusão única dos endpoints existentes', async () => {
    const detalhe = await request(app.getHttpServer())
      .get(`/provas/${provaId}`)
      .set('Cookie', aluno)
      .expect(200);
    const objetiva = detalhe.body.questoes.find(
      (q: { tipo: string }) => q.tipo === 'MULTIPLA_ESCOLHA',
    );
    const dissertativa = detalhe.body.questoes.find(
      (q: { tipo: string }) => q.tipo === 'DISSERTATIVA',
    );
    const respostas = [
      { questaoId: objetiva.id, alternativaId: objetiva.alternativas[0].id },
      { questaoId: dissertativa.id, respostaTexto: 'Resposta preservada.' },
    ];
    const corrigido = await request(app.getHttpServer())
      .post(`/provas/${provaId}/respostas`)
      .set('Cookie', aluno)
      .send({ respostas })
      .expect(201);
    expect(corrigido.body.resultado[0]).toHaveProperty('correta');
    const dados = {
      respostas,
      acertos: corrigido.body.acertos,
      totalQuestoes: corrigido.body.totalQuestoes,
    };
    await request(app.getHttpServer())
      .post(`/provas/${provaId}/finalizar`)
      .set('Cookie', aluno)
      .send(dados)
      .expect(201);
    const novamente = await request(app.getHttpServer())
      .post(`/provas/${provaId}/finalizar`)
      .set('Cookie', aluno)
      .send(dados)
      .expect(201);
    expect(novamente.body.jaConcluida).toBe(true);
    expect(
      await prisma.resultadoProva.count({
        where: { usuarioId: alunoId, provaId },
      }),
    ).toBe(1);
    const status = await request(app.getHttpServer())
      .get(`/provas/${provaId}/status`)
      .set('Cookie', aluno)
      .expect(200);
    expect(status.body.concluida).toBe(true);
  });
  it('oferece os mesmos indicadores ao aluno e ao administrador', async () => {
    const meu = await request(app.getHttpServer())
      .get('/desempenho/me')
      .set('Cookie', aluno)
      .expect(200);
    expect(meu.body).toMatchObject({
      usuarioId: alunoId,
      totalAulasConcluidas: 0,
      totalQuizzesConcluidos: 1,
      totalSimulacoesConcluidas: 2,
      totalProvasRealizadas: 1,
      mediaNotas: 10,
    });
    const administrativo = await request(app.getHttpServer())
      .get(`/admin/desempenho/usuarios/${alunoId}`)
      .set('Cookie', admin)
      .expect(200);
    expect(administrativo.body).toEqual(meu.body);
    const relatorios = await request(app.getHttpServer())
      .get('/admin/relatorios')
      .set('Cookie', admin)
      .expect(200);
    expect(
      relatorios.body.find(
        (r: { usuarioId: string }) => r.usuarioId === alunoId,
      ),
    ).toEqual(meu.body);
  });
  it('valida domínios e persiste consultas sem expor a chave do VirusTotal', async () => {
    const spy = jest
      .spyOn(app.get(VirusTotalService), 'obterRelatorioVirusTotal')
      .mockResolvedValue({
        malicious: 1,
        suspicious: 0,
        harmless: 10,
        undetected: 0,
        timeout: 0,
      });
    try {
      await request(app.getHttpServer())
        .post('/seguranca/consultar-dominio')
        .set('Cookie', aluno)
        .send({ dominio: 'https://exemplo.com' })
        .expect(400);
      expect(spy).not.toHaveBeenCalled();
      const retorno = await request(app.getHttpServer())
        .post('/seguranca/consultar-dominio')
        .set('Cookie', aluno)
        .send({ dominio: 'EXEMPLO.COM' })
        .expect(200);
      expect(retorno.body).toMatchObject({
        dominio: 'exemplo.com',
        resultado: 'MALICIOSO',
        deteccoesMaliciosas: 1,
      });
      expect(retorno.body).not.toHaveProperty('VIRUSTOTAL_API_KEY');
      expect(
        await prisma.consultaSeguranca.count({ where: { usuarioId: alunoId } }),
      ).toBe(1);
    } finally {
      spy.mockRestore();
    }
  });
});
