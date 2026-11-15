require('dotenv').config({ quiet: true });
require('ts-node').register({ transpileOnly: true, compilerOptions: { rootDir: '.' } });
require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const { JwtService } = require('@nestjs/jwt');
const request = require('supertest');
const assert = require('node:assert/strict');
const { AppModule } = require('../src/app.module');
const { PrismaService } = require('../src/prisma.service');
(async () => {
  const app = await NestFactory.create(AppModule, { logger: false });
  try {
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    const prisma = app.get(PrismaService);
    const admin = await prisma.usuario.findFirst({ where: { papel: 'ADMIN' }, select: { id: true } });
    if (!admin) throw new Error('Nenhum administrador disponível para verificação.');
    const jwt = new JwtService({ secret: process.env.JWT_SECRET });
    const cookie = `cybereduca_session=${jwt.sign({ sub: admin.id }, { expiresIn: '2m' })}`;
    const server = app.getHttpServer();
    let resumo, resultadosProvas;
    const routes = ['/admin/dashboard', '/admin/trilhas', '/admin/aulas', '/admin/provas', '/admin/quizzes', '/admin/simulacoes', '/admin/categorias-simulacao', '/admin/usuarios', '/admin/resultados/provas', '/admin/resultados/simulacoes', '/admin/historico?limite=1', '/admin/historico?resultado=falha&pagina=1'];
    for (const route of routes) {
      const response = await request(server).get(route).set('Cookie', cookie);
      console.log(JSON.stringify({ route, status: response.status }));
      if (response.status !== 200) throw new Error(`Falha na consulta ${route}: ${response.status}`);
      if (route.startsWith('/admin/historico') && JSON.stringify(response.body).match(/senhaHash|dadosAnteriores|dadosNovos|tokenRecuperacao/)) throw new Error('Campos privados no histórico.');
      if (route === '/admin/dashboard') resumo = response.body;
      if (route === '/admin/resultados/provas') resultadosProvas = response.body;
    }
    const trilhas = await prisma.trilha.findMany({ select: { id: true, aulas: { select: { id: true } } } });
    const progressos = await prisma.progressoAula.findMany({ where: { concluida: true, usuario: { papel: { in: ['USUARIO', 'ALUNO'] } } }, select: { usuarioId: true, aulaId: true, dataConclusao: true } });
    const { RETIRED_TRACK, EXAM_IDS, passed } = require('../src/certificacoes/certification-progress');
    let iniciadas = 0, concluidas = 0;
    for (const trilha of trilhas.filter(item => item.id !== RETIRED_TRACK)) {
      const aulas = new Set(trilha.aulas.map(item => item.id)), porAluno = new Map();
      for (const progresso of progressos) if (aulas.has(progresso.aulaId)) {
        const feitas = porAluno.get(progresso.usuarioId) || new Set();
        feitas.add(progresso.aulaId); porAluno.set(progresso.usuarioId, feitas);
      }
      iniciadas += porAluno.size;
      concluidas += [...porAluno.values()].filter(feitas => aulas.size > 0 && feitas.size === aulas.size).length;
    }
    assert.deepEqual(resumo.progressoTrilhas, { iniciadas, emAndamento: iniciadas - concluidas, concluidas });
    assert.equal(resumo.taxaConclusao, iniciadas ? concluidas / iniciadas * 100 : null);
    assert.ok(resumo.trilhasPopulares.length <= 5);
    for (const login of resumo.acessos) assert.deepEqual(Object.keys(login).sort(), ['criadoEm', 'id', 'usuarioId']);
    for (const item of resumo.conclusoesTrilhas) assert.ok(item.usuarioId && item.trilhaId && Number.isFinite(Date.parse(item.criadoEm)));
    const tentativas = await prisma.tentativaProva.findMany({ where: { concluidoEm: { not: null } }, select: { id: true, provaId: true, totalAcertos: true, totalQuestoes: true } });
    const porId = new Map(resultadosProvas.map(item => [item.id, item]));
    for (const tentativa of tentativas) {
      const resultado = porId.get(tentativa.id);
      assert.ok(resultado, 'Tentativa concluída deve aparecer nos resultados administrativos');
      assert.equal(resultado.acertos, tentativa.totalAcertos);
      if (Object.values(EXAM_IDS).includes(tentativa.provaId) && tentativa.totalQuestoes > 0) assert.equal(resultado.aprovado, passed(tentativa));
    }
    console.log(JSON.stringify({ calculosReais: 'OK', progresso: resumo.progressoTrilhas, taxaConclusao: resumo.taxaConclusao, tentativasVerificadas: tentativas.length }));
    const semSessao = await request(server).get('/admin/historico');
    if (semSessao.status !== 401) throw new Error('Histórico precisa exigir autenticação.');
    const aluno = await prisma.usuario.findFirst({ where: { papel: { not: 'ADMIN' } }, select: { id: true } });
    if (aluno) {
      const cookieAluno = `cybereduca_session=${jwt.sign({ sub: aluno.id }, { expiresIn: '2m' })}`;
      for (const route of routes) {
        assert.equal((await request(server).get(route)).status, 401, `Autenticação em ${route}`);
        assert.equal((await request(server).get(route).set('Cookie', cookieAluno)).status, 403, `Restrição administrativa em ${route}`);
      }
      const resposta = await request(server).get('/admin/historico').set('Cookie', `cybereduca_session=${jwt.sign({ sub: aluno.id }, { expiresIn: '2m' })}`);
      if (resposta.status !== 403) throw new Error('Histórico precisa restringir alunos.');
      console.log(JSON.stringify({ autorizacao: '401 sem sessão e 403 para aluno' }));
    }
    const invalid = await request(server).get('/admin/historico?limite=10000').set('Cookie', cookie);
    if (invalid.status !== 400) throw new Error('Limite inválido foi aceito.');
    console.log('Consultas administrativas reais e controles de acesso verificados. Nenhum registro foi alterado.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
  finally { await app.close(); }
})().catch(() => { console.error('Não foi possível iniciar a verificação administrativa.'); process.exitCode = 1; });
