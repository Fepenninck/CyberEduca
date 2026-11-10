import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { ConflictException } from '@nestjs/common';
import { PrismaService } from '../src/prisma.service';
import { QuizzesService } from '../src/quizzes/quizzes.service';
import { PhishingService } from '../src/phishing/phishing.service';
import { SimulacoesService } from '../src/simulacoes/simulacoes.service';
import { AvaliacoesService } from '../src/avaliacoes/avaliacoes.service';
import { CorrecaoProvaService } from '../src/avaliacoes/correcao-prova.service';
import { ProvasService } from '../src/provas/provas.service';
import { AuditoriaService } from '../src/auditoria.service';

const prisma = new PrismaService();
const usuarioId = randomUUID();
const outroId = randomUUID();
const trilhaId = randomUUID();
const aulaId = randomUUID();
const quizId = randomUUID();
const cenarioId = randomUUID();
const categoriaId = randomUUID();
const simulacaoId = randomUUID();

async function main() {
  await prisma.$transaction(async tx => {
    await tx.usuario.createMany({ data: [usuarioId, outroId].map(id => ({ id, nome: 'Verificação temporária', email: `${id}@example.invalid` })) });
    await tx.trilha.create({ data: { id: trilhaId, titulo: 'Verificação temporária', descricao: 'Fixture', ordem: 9999 } });
    await tx.aula.create({ data: { id: aulaId, titulo: 'Fixture', trilhaId, ordem: 1 } });
    await tx.quiz.create({ data: { id: quizId, titulo: 'Fixture', descricao: 'Fixture', aulaId, status: 'PUBLICADO', questoes: { create: {
      enunciado: 'Escolha A', explicacao: 'A é a correta.', ordem: 1,
      alternativas: { create: [{ texto: 'A', correta: true, ordem: 1 }, { texto: 'B', correta: false, ordem: 2 }] },
    } } } });
    await tx.cenarioPhishing.create({ data: { id: cenarioId, titulo: 'Fixture', descricao: 'Fixture', aulaId,
      status: 'PUBLICADO', conteudoMensagem: 'Mensagem de teste', tipo: 'EMAIL', ehPhishing: true, explicacao: 'Explicação de teste.' } });
    await tx.categoriaSimulacao.create({ data: { id: categoriaId, nome: `Fixture ${categoriaId}`, descricao: 'Fixture' } });
    await tx.simulacao.create({ data: { id: simulacaoId, categoriaId, titulo: 'Fixture', descricao: 'Fixture', questoes: { create: {
      enunciado: 'Escolha A', alternativas: { create: [{ texto: 'A', isCorreta: true }, { texto: 'B', isCorreta: false }] },
    } } } });
  });

  const quizzes = new QuizzesService(prisma);
  const phishing = new PhishingService(prisma);
  const treinos = new SimulacoesService(prisma);
  const avaliacoes = new AvaliacoesService(prisma, new CorrecaoProvaService());
  const provasService = new ProvasService(prisma, new AuditoriaService(prisma), avaliacoes);

  const quiz = await quizzes.buscarQuiz(quizId, usuarioId);
  assert.equal(quiz.resultado, null);
  const respostas = quiz.questoes.map(q => ({ questaoId: q.id, alternativaId: q.alternativas[0].id }));
  // Duas abas enviando juntas: somente uma tentativa deve ser persistida.
  const envios = await Promise.allSettled([1, 2].map(() => quizzes.responderQuiz(usuarioId, quizId, { respostas })));
  assert.equal(envios.filter(e => e.status === 'fulfilled').length, 1);
  assert.equal(await prisma.tentativaQuiz.count({ where: { usuarioId, quizId } }), 1);
  assert.equal((await quizzes.buscarQuiz(quizId, usuarioId)).resultado?.totalAcertos, 1);
  assert.equal((await quizzes.listarQuizzes(aulaId, usuarioId))[0].tentativas.length, 1);
  assert.equal((await quizzes.buscarQuiz(quizId, outroId)).resultado, null);
  assert.equal((await quizzes.listarQuizzes(aulaId, outroId))[0].tentativas.length, 0);

  await phishing.responderCenario(usuarioId, cenarioId, { respostaEhPhishing: true });
  await assert.rejects(() => phishing.responderCenario(usuarioId, cenarioId, { respostaEhPhishing: false }), ConflictException);
  assert.equal((await phishing.buscarCenario(cenarioId, usuarioId)).resultado?.respostaEhPhishing, true);
  assert.equal((await phishing.listarCenarios(aulaId, usuarioId))[0].tentativas.length, 1);
  assert.equal((await phishing.buscarCenario(cenarioId, outroId)).resultado, null);

  const treino = await treinos.buscarParaAluno(simulacaoId, usuarioId);
  const respostasTreino = treino.questoes.map(q => ({ questaoId: q.id, alternativaId: q.alternativas[0].id }));
  const correcao = await treinos.responder(simulacaoId, respostasTreino, usuarioId);
  const dados = { respostas: respostasTreino, acertos: correcao.respostas.filter(r => r.correta).length, totalQuestoes: 1 };
  await treinos.finalizarParaAluno(simulacaoId, usuarioId, dados);
  assert.equal((await treinos.statusDoAluno(simulacaoId, usuarioId)).concluida, true);
  assert.equal((await treinos.buscarCategoriaParaAluno(categoriaId, usuarioId)).simulacoes[0].concluida, true);
  assert.equal((await treinos.buscarCategoriaParaAluno(categoriaId, outroId)).simulacoes[0].concluida, false);
  assert.equal((await treinos.finalizarParaAluno(simulacaoId, usuarioId, dados)).jaConcluida, true);

  const provas = await prisma.prova.findMany({ where: { id: { startsWith: 'ce000000-0000-4000-8002-' } }, include: { trilha: true, questoes: { include: { alternativas: true } } } });
  assert.equal(provas.length, 3);
  assert.equal(new Set(provas.map(p => p.trilha.nivel)).size, 3);
  for (const prova of provas) {
    assert.equal(prova.status, 'PUBLICADA');
    assert.equal(prova.questoes.length, 10);
    assert.ok(prova.questoes.every(q => q.explicacao.includes('Aula de referência:') && q.alternativas.filter(a => a.isCorreta).length === 1));
  }
  const prova = provas[0];
  const respostasProva = prova.questoes.map(q => ({ questaoId: q.id, alternativaId: q.alternativas.find(a => a.isCorreta)!.id }));
  const resultado = await avaliacoes.salvarTentativaProva(usuarioId, prova.id, respostasProva);
  assert.equal(resultado.nota, 10);
  assert.equal((await avaliacoes.buscarResultadoProva(resultado.tentativaId, usuarioId)).nota, 10);
  await assert.rejects(() => avaliacoes.salvarTentativaProva(usuarioId, prova.id, respostasProva), ConflictException);
  assert.equal((await avaliacoes.listarMinhasTentativas(outroId)).length, 0);
  assert.ok(await prisma.resultadoProva.findUnique({ where: { usuarioId_provaId: { usuarioId, provaId: prova.id } } }));
  assert.equal((await provasService.statusDoAluno(prova.id, usuarioId)).concluida, true);
  assert.equal((await provasService.finalizarParaAluno(prova.id, usuarioId, {
    acertos: 0, totalQuestoes: 10, respostas: respostasProva,
  })).jaConcluida, true);
  await assert.rejects(() => provasService.corrigirRespostas(prova.id, respostasProva, usuarioId), ConflictException);
  console.log('Validado: reabertura, isolamento por conta, bloqueio de reenvio e concorrência; 3 avaliações finais com 30 questões.');
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  // Apaga exclusivamente os IDs aleatórios criados por esta execução.
  await prisma.$transaction(async tx => {
    await tx.usuario.deleteMany({ where: { id: { in: [usuarioId, outroId] } } });
    await tx.alternativaQuiz.deleteMany({ where: { questao: { quizId } } });
    await tx.questaoQuiz.deleteMany({ where: { quizId } });
    await tx.quiz.deleteMany({ where: { id: quizId } });
    await tx.cenarioPhishing.deleteMany({ where: { id: cenarioId } });
    await tx.simulacao.deleteMany({ where: { id: simulacaoId } });
    await tx.categoriaSimulacao.deleteMany({ where: { id: categoriaId } });
    await tx.trilha.deleteMany({ where: { id: trilhaId } });
  });
  await prisma.$disconnect();
});
