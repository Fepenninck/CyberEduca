import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { QuizzesService } from '../src/quizzes/quizzes.service';
import { PhishingService } from '../src/phishing/phishing.service';
import { buildCatalog } from '../prisma/content/catalog';
import { PrismaService } from '../src/prisma.service';

const p = new PrismaClient();
const rollback = new Error('VERIFIED_ROLLBACK');
async function main() {
  const catalog = buildCatalog();
  const aulas = catalog.courses.flatMap(c => c.aulas);
  const counts = {
    trilhas: await p.trilha.count({where:{id:{in:catalog.courses.map(c=>c.id)}}}),
    aulas: await p.aula.count({where:{id:{in:aulas.map(a=>a.id)}}}),
    quizzes: await p.quiz.count({where:{id:{in:aulas.map(a=>a.quiz.id)}}}),
    cenarios: await p.cenarioPhishing.count({where:{id:{in:catalog.cenarios.map(c=>c.id)}}}),
  };
  assert.deepEqual(counts, {trilhas:12,aulas:91,quizzes:91,cenarios:12});
  console.log(JSON.stringify(counts));
  try {
    await p.$transaction(async tx => {
      const adapter = new Proxy(tx, {get(target, key) {
        return key === '$transaction' ? (operation: (client: typeof tx)=>unknown) => operation(tx) : Reflect.get(target,key);
      }}) as unknown as PrismaService;
      const quizzes = new QuizzesService(adapter);
      const phishing = new PhishingService(adapter);
      const user = await tx.usuario.create({data:{nome:'Verificação temporária',email:`verify-${randomUUID()}@example.invalid`}});
      const quiz = aulas[0].quiz;
      const publicQuiz = await quizzes.buscarQuiz(quiz.id);
      assert.ok(!JSON.stringify(publicQuiz).includes('correta'));
      assert.ok(!JSON.stringify(publicQuiz).includes('explicacao'));
      const before = await tx.progressoAula.count({where:{usuarioId:user.id}});
      for (const alternativa of quiz.questao.alternativas) {
        const result = await quizzes.responderQuiz(user.id, quiz.id, {respostas:[{questaoId:quiz.questao.id,alternativaId:alternativa.id}]});
        assert.equal(result.totalAcertos,alternativa.correta ? 1 : 0);
        const saved = await tx.tentativaQuiz.findUniqueOrThrow({where:{id:result.tentativaId},include:{respostas:true}});
        assert.equal(saved.usuarioId,user.id);
        assert.equal(saved.respostas.length,1);
        assert.equal(result.progressoAtualizado,false);
      }
      await assert.rejects(()=>quizzes.responderQuiz(user.id,quiz.id,{respostas:[{questaoId:quiz.questao.id,alternativaId:randomUUID()}]}));
      const cenario = catalog.cenarios[0];
      const publicScenario = await phishing.buscarCenario(cenario.id);
      assert.ok(!('ehPhishing' in publicScenario));
      assert.ok(!('explicacao' in publicScenario));
      for (const respostaEhPhishing of [true,false]) {
        const result = await phishing.responderCenario(user.id,cenario.id,{respostaEhPhishing});
        assert.equal(result.acertou,respostaEhPhishing===cenario.ehPhishing);
        assert.equal((await tx.tentativaPhishing.findUniqueOrThrow({where:{id:result.tentativaId}})).usuarioId,user.id);
        assert.equal(result.progressoAtualizado,false);
      }
      assert.equal(await tx.progressoAula.count({where:{usuarioId:user.id}}),before);
      throw rollback;
    },{timeout:60000});
  } catch(e) { if(e!==rollback) throw e; }
  console.log('VERIFIED: correção, gabaritos ocultos, tentativas por usuário e progresso preservado; dados de teste revertidos.');
}
main().catch(e=>{console.error('VERIFICATION_FAILED',e.code || e.name);process.exitCode=1}).finally(()=>p.$disconnect());
