import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { CertificacoesService } from '../src/certificacoes/certificacoes.service';
import { CorrecaoProvaService } from '../src/avaliacoes/correcao-prova.service';
import { EXAM_IDS, LEVELS, RETIRED_TRACK, RETRY_DELAY } from '../src/certificacoes/certification-progress';
import { AprendizagemService } from '../src/aprendizagem/aprendizagem.service';
import { UsuariosService } from '../src/usuarios/usuarios.service';
import { ProvasService } from '../src/provas/provas.service';
import type { PrismaService } from '../src/prisma.service';

const prisma = new PrismaClient();
const rollback = new Error('VERIFICACAO_CERTIFICACOES_ROLLBACK');
async function main() {
 const before = { tentativas: await prisma.tentativaProva.count(), respostas: await prisma.respostaProva.count(), progresso: await prisma.progressoAula.count() };
 try {
  await prisma.$transaction(async tx => {
   const marker = `verificar-certificacoes-${randomUUID()}`;
   const user = await tx.usuario.create({ data: { nome: marker, email: `${marker}@example.invalid` } });
   const other = await tx.usuario.create({ data: { nome: marker, email: `${marker}-outro@example.invalid` } });
   const adapter = new Proxy(tx, { get(target, key) { return key === '$transaction' ? (operation: (client: typeof tx) => unknown) => operation(tx) : Reflect.get(target, key); } }) as unknown as PrismaService;
   const service = new CertificacoesService(adapter, new JwtService(), new CorrecaoProvaService());
   const learning = new AprendizagemService(adapter, { registrar: async () => undefined } as any);
   const users = new UsuariosService(adapter);
   const lessons = await tx.aula.findMany({ where: { trilhaId: { not: RETIRED_TRACK } }, select: { id: true } });
   const initial = await service.status(user.id);
   assert.equal(initial[0].podeIniciar, false);
   await assert.rejects(service.iniciar(user.id, 'BASICO'));
   await tx.progressoAula.createMany({ data: lessons.map(aula => ({ usuarioId: user.id, aulaId: aula.id, concluida: true, dataConclusao: new Date() })) });
   assert.ok((await users.conquistas(user.id)).every(item => !item.conquistada));
   assert.ok((await learning.listarTrilhas(user.id)).filter(track => track.nivel !== 'BASICO').every(track => track.bloqueada));
   await assert.rejects(service.iniciar(user.id, 'INTERMEDIARIO'));
   const oldService = new ProvasService(adapter, {} as any, {} as any);
   await assert.rejects(oldService.enviarTentativa(EXAM_IDS.BASICO, user.id, { respostas: [] }));
   await assert.rejects(oldService.corrigirRespostas(EXAM_IDS.BASICO, [], user.id));
   for (const [levelIndex, level] of LEVELS.entries()) {
    const paper = await service.iniciar(user.id, level);
    const reloaded = await service.iniciar(user.id, level);
    assert.deepEqual(paper.questoes.map(item => item.id), reloaded.questoes.map(item => item.id));
    assert.equal(paper.totalQuestoes, (await service.status(user.id))[levelIndex].totalAulas);
    assert.equal(JSON.stringify(paper).includes('isCorreta'), false);
    assert.equal(JSON.stringify(paper).includes('explicacao'), false);
    await assert.rejects(service.enviar(other.id, level, paper.token, []));
    await assert.rejects(service.enviar(user.id, level, paper.token.slice(0, -5) + 'xxxxx', []));
    await assert.rejects(service.enviar(user.id, level, paper.token, []));
    assert.equal((await service.status(user.id))[levelIndex].ultimaTentativa, null);
    const answersFor = async (content: typeof paper, correctCount: number) => {
     const questions = await tx.questaoProva.findMany({ where: { id: { in: content.questoes.map(item => item.id) } }, include: { alternativas: true } });
     return content.questoes.map((item, index) => ({ questaoId: item.id, alternativaId: questions.find(question => question.id === item.id)!.alternativas.find(answer => answer.isCorreta === (index < correctCount))!.id }));
    };
    const failure = await service.enviar(user.id, level, paper.token, await answersFor(paper, 0));
    assert.equal(failure.aprovado, false);
    assert.equal(failure.nota, 0);
    assert.ok(failure.proximaTentativaEm);
    const failedState = (await service.status(user.id))[levelIndex];
    assert.equal(failedState.motivo, 'AGUARDE');
    assert.equal((await users.conquistas(user.id))[levelIndex].conquistada, false);
    await assert.rejects(service.iniciar(user.id, level));
    await assert.rejects(service.enviar(user.id, level, paper.token, await answersFor(paper, paper.totalQuestoes)));
    // Avança somente a data da tentativa temporária, sem esperar 24 horas reais.
    await tx.tentativaProva.update({ where: { id: failure.tentativaId }, data: { concluidoEm: new Date(Date.now() - RETRY_DELAY - 1000) } });
    const retry = await service.iniciar(user.id, level);
    const previous = new Set(paper.questoes.map(item => item.id));
    assert.ok(retry.questoes.every(item => !previous.has(item.id)));
    const approval = await service.enviar(user.id, level, retry.token, await answersFor(retry, Math.ceil(retry.totalQuestoes * .6)));
    assert.equal(approval.aprovado, true);
    assert.ok(approval.nota >= 6);
    assert.equal(approval.proximaTentativaEm, null);
    assert.equal(approval.feedback.length, retry.totalQuestoes);
    assert.equal((await users.conquistas(user.id))[levelIndex].conquistada, true);
    await assert.rejects(service.iniciar(user.id, level));
    await assert.rejects(service.enviar(user.id, level, retry.token, await answersFor(retry, retry.totalQuestoes)));
    const saved = await tx.tentativaProva.findMany({ where: { usuarioId: user.id, provaId: EXAM_IDS[level] }, include: { respostas: true } });
    assert.equal(saved.length, 2);
    assert.ok(saved.every(item => item.respostas.length === paper.totalQuestoes));
    const tracks = await learning.listarTrilhas(user.id);
    if (levelIndex < 2) assert.ok(tracks.filter(track => track.nivel === LEVELS[levelIndex + 1]).every(track => !track.bloqueada));
   }
   assert.ok((await users.conquistas(user.id)).every(item => item.conquistada));
   assert.ok((await service.status(other.id)).every(item => !item.conquistada));
   throw rollback;
  }, { timeout: 90000 });
 } catch (error) { if (error !== rollback) throw error; }
 assert.equal(await prisma.tentativaProva.count(), before.tentativas);
 assert.equal(await prisma.respostaProva.count(), before.respostas);
 assert.equal(await prisma.progressoAula.count(), before.progresso);
 console.log('PASS: três níveis, nota 6, bloqueios de acesso, identidade, gabarito oculto, 24h, troca de todas as questões, insígnias e histórico. Dados de teste revertidos.');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
