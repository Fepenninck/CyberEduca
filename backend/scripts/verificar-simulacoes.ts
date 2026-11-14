import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { SIMULATION_SEEDS } from '../prisma/content/simulations';
const prisma = new PrismaClient();
const origin = process.env.SIMULATION_TEST_API || 'http://localhost:3002';
async function main() {
  const created: string[] = [];
  let checks = 0;
  try {
    const users = [];
    for (let index = 0; index < 2; index++) {
      const user = await prisma.usuario.create({ data: { nome: 'Simulation verification', email: `simulation-check-${randomUUID()}@example.invalid` } });
      created.push(user.id); users.push(user);
    }
    const jwt = new JwtService({ secret: process.env.JWT_SECRET });
    const token = jwt.sign({ sub: users[0].id }, { expiresIn: '5m' });
    const secondToken = jwt.sign({ sub: users[1].id }, { expiresIn: '5m' });
    const api = async (path: string, body?: unknown, auth = token) => {
      const response = await fetch(`${origin}${path}`, { method: body ? 'POST' : 'GET', headers: { cookie: `cybereduca_session=${auth}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
      return { status: response.status, body: await response.json() as any };
    };
    assert.equal((await fetch(`${origin}/simulacoes`)).status, 401); checks++;
    const catalog = await api('/simulacoes');
    assert.equal(catalog.status, 200);
    assert(catalog.body.every((item: any) => item.nivel && item.categoria?.nome && item.resultados.length === 0)); checks++;
    const selected = await prisma.simulacao.findMany({ where: { titulo: { in: SIMULATION_SEEDS.map(item => item.titulo) } }, include: { questoes: { orderBy: { ordem: 'asc' }, include: { alternativas: true } } } });
    assert.equal(selected.length, SIMULATION_SEEDS.length);
    assert.equal(new Set(selected.map(item => item.nivel)).size, 3); checks++;
    for (const scenario of selected) {
      const content = await api(`/simulacoes/${scenario.id}`);
      assert.equal(content.status, 200);
      assert.equal(content.body.questoes.length, 3);
      assert(content.body.questoes.every((item: any) => item.contexto && !('explicacao' in item) && item.alternativas.every((option: any) => !('isCorreta' in option))));
      const answers = scenario.questoes.map(question => ({ questaoId: question.id, alternativaId: question.alternativas.find(item => item.isCorreta)!.id }));
      if (checks === 3) {
        assert.equal((await api(`/simulacoes/${scenario.id}/finalizar`, { respostas: [] })).status, 400);
        assert.equal((await api(`/simulacoes/${scenario.id}/finalizar`, { respostas: [answers[0], answers[0], answers[2]] })).status, 400);
        assert.equal((await api(`/simulacoes/${scenario.id}/finalizar`, { respostas: answers, acertos: 0, totalQuestoes: 3 })).status, 400);
        assert.equal((await api(`/simulacoes/${scenario.id}/finalizar`, { respostas: [{ ...answers[0], alternativaId: randomUUID() }, ...answers.slice(1)] })).status, 400);
      }
      const completed = await api(`/simulacoes/${scenario.id}/finalizar`, { respostas: answers });
      assert.equal(completed.status, 201);
      assert.equal(completed.body.acertos, 3);
      assert.equal(completed.body.respostas.length, 3);
      assert(completed.body.respostas.every((item: any) => item.explicacao && item.textoEscolhido && item.enunciado));
      const saved = await api(`/simulacoes/${scenario.id}/status`);
      assert.equal(saved.body.concluida, true);
      assert.deepEqual(saved.body.resultado.respostas, completed.body.respostas);
      const replay = await api(`/simulacoes/${scenario.id}/finalizar`, { respostas: answers });
      assert.equal(replay.body.jaConcluida, true);
      assert.deepEqual(replay.body.respostas, completed.body.respostas);
      assert.equal((await api(`/simulacoes/${scenario.id}/status`, undefined, secondToken)).body.concluida, false);
      if (scenario.id === selected[0].id) {
        assert.equal((await api(`/simulacoes/${scenario.id}`)).status, 200);
        const tentativaId = randomUUID();
        const wrongAnswers = scenario.questoes.map(question => ({ questaoId: question.id, alternativaId: question.alternativas.find(item => !item.isCorreta)!.id }));
        const repeated = await api(`/simulacoes/${scenario.id}/finalizar`, { refazer: true, tentativaId, respostas: wrongAnswers });
        assert.equal(repeated.status, 201);
        assert.equal(repeated.body.acertos, 0);
        assert.equal(await prisma.resultadoSimulacao.count({ where: { usuarioId: users[0].id, simulacaoId: scenario.id } }), 2);
        assert.equal((await api(`/simulacoes/${scenario.id}/status`)).body.resultado.acertos, 0);
        assert.equal((await api(`/simulacoes/${scenario.id}/finalizar`, { refazer: true, tentativaId, respostas: answers })).body.acertos, 0);
        assert.equal(await prisma.resultadoSimulacao.count({ where: { usuarioId: users[0].id, simulacaoId: scenario.id } }), 2);
        assert.equal((await api(`/simulacoes/${scenario.id}/finalizar`, { refazer: true, tentativaId, respostas: answers }, secondToken)).status, 400);
        checks++;
      }
      checks++;
    }
    const finalCatalog = await api('/simulacoes');
    assert.equal(finalCatalog.body.filter((item: any) => selected.some(seed => seed.id === item.id) && item.resultados.length === 1).length, 12); checks++;
    const phishing = await api('/phishing/cenarios');
    assert.equal(phishing.status, 200);
    assert(phishing.body.every((item: any) => item.aula.trilha.nivel && !('ehPhishing' in item) && !('explicacao' in item))); checks++;
    if (phishing.body.length) {
      const cenarioId = phishing.body[0].id;
      const primeiraId = randomUUID();
      const path = `/phishing/cenarios/${cenarioId}/tentativas`;
      const first = await api(path, { respostaEhPhishing: true, tentativaId: primeiraId });
      assert.equal(first.status, 201);
      assert.equal((await api(path, { respostaEhPhishing: true, tentativaId: primeiraId })).body.tentativaId, primeiraId);
      const segundaId = randomUUID();
      assert.equal((await api(path, { respostaEhPhishing: false, refazer: true, tentativaId: segundaId })).status, 201);
      assert.equal(await prisma.tentativaPhishing.count({ where: { usuarioId: users[0].id, cenarioId } }), 2);
      assert.equal((await api(`/phishing/cenarios/${cenarioId}`)).body.resultado.tentativaId, segundaId);
      assert.equal((await api(path, { respostaEhPhishing: true, refazer: true, tentativaId: segundaId }, secondToken)).status, 400);
      checks++;
    }
    console.log(`PASS: ${checks} verifications; all 12 simulations completed through authenticated HTTP, feedback persisted, invalid answers rejected, users isolated.`);
  } finally { await prisma.usuario.deleteMany({ where: { id: { in: created } } }); }
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Verification failed'); process.exitCode = 1; }).finally(() => prisma.$disconnect());
