import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { buildCatalog } from '../prisma/content/catalog';
import { lessonEditorial } from '../prisma/content/lesson-editorial';

const prisma = new PrismaClient();
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const campos = ['concept', 'caseStudy', 'practice', 'takeaway'] as const;

async function historicos() {
  const rows = await Promise.all([
    prisma.progressoAula.findMany({ orderBy: { id: 'asc' } }),
    prisma.tentativaQuiz.findMany({ orderBy: { id: 'asc' } }),
    prisma.respostaQuiz.findMany({ orderBy: { id: 'asc' } }),
    prisma.tentativaProva.findMany({ orderBy: { id: 'asc' } }),
    prisma.respostaProva.findMany({ orderBy: { id: 'asc' } }),
    prisma.resultadoProva.findMany({ orderBy: { id: 'asc' } }),
    prisma.quiz.findMany({ orderBy: { id: 'asc' } }),
    prisma.questaoQuiz.findMany({ orderBy: { id: 'asc' } }),
    prisma.prova.findMany({ orderBy: { id: 'asc' } }),
    prisma.questaoProva.findMany({ orderBy: { id: 'asc' } }),
  ]);
  return rows.map(items => ({ quantidade: items.length, hash: hash(items) }));
}

async function main() {
  const catalogo = buildCatalog().courses.flatMap(course => course.aulas);
  assert.equal(catalogo.length, 91);
  assert.equal(Object.keys(lessonEditorial).length, catalogo.length);
  const stored = await prisma.aula.findMany({ orderBy: { id: 'asc' }, select: { id: true, titulo: true, conteudo: true } });
  const porId = new Map(stored.map(item => [item.id, item]));
  const changes = catalogo.map(aula => {
    const atual = porId.get(aula.id);
    assert.ok(atual, `Aula ausente: ${aula.titulo}`);
    assert.equal(atual.titulo, aula.titulo, `Título diverge: ${aula.id}`);
    const antes = JSON.parse(atual.conteudo);
    const revisado = JSON.parse(aula.conteudo);
    assert.ok(revisado.concept.length >= 650, `Explicação insuficiente: ${aula.titulo}`);
    assert.ok(revisado.caseStudy.length >= 240, `Exemplo insuficiente: ${aula.titulo}`);
    assert.ok(revisado.practice.length >= 80, `Reflexão insuficiente: ${aula.titulo}`);
    assert.ok(revisado.takeaway.length >= 45, `Síntese insuficiente: ${aula.titulo}`);
    assert.ok(!/atividade (desta página|nesta página|abaixo)|correção aparece aqui/i.test(revisado.practice));
    // Atualização restrita aos textos: mantém mídias, glossários e material técnico já salvo.
    const depois = { ...antes };
    for (const campo of campos) depois[campo] = revisado[campo];
    if (depois.video) depois.video = { ...depois.video, prompt: depois.video.prompt.replace(/Você responde à atividade nesta página\./g, '').trim() };
    assert.deepEqual(depois.diagram, antes.diagram);
    assert.deepEqual(depois.readings, antes.readings);
    if (antes.video) assert.equal(depois.video.url, antes.video.url);
    const conteudo = JSON.stringify(depois);
    return { atual, conteudo };
  });
  if (process.argv.includes('--verify')) {
    for (const item of changes) assert.deepEqual(JSON.parse(item.atual.conteudo), JSON.parse(item.conteudo), `Atualização ausente: ${item.atual.titulo}`);
    console.log('91 aulas verificadas: explicação, caso, reflexão e síntese específicos; mídias preservadas.');
    return;
  }
  const pendentes = changes.filter(item => item.atual.conteudo !== item.conteudo);
  if (!process.argv.includes('--apply')) {
    console.log(JSON.stringify({ aulas: changes.length, atualizacoesPendentes: pendentes.length, outrasAulasPreservadas: stored.length - changes.length, modo: 'prévia; banco intacto' }));
    return;
  }
  if (!pendentes.length) { console.log('Revisão já aplicada.'); return; }
  const before = await historicos();
  const backupDir = resolve(process.cwd(), '../.local/backups');
  await mkdir(backupDir, { recursive: true });
  const backup = resolve(backupDir, `aulas-editorial-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  await writeFile(backup, JSON.stringify({ criadoEm: new Date().toISOString(), aulas: stored, historicos: before }, null, 2), { flag: 'wx' });
  await prisma.$transaction(async tx => {
    for (const item of pendentes) {
      const update = await tx.aula.updateMany({ where: { id: item.atual.id, conteudo: item.atual.conteudo }, data: { conteudo: item.conteudo } });
      assert.equal(update.count, 1, `Aula alterada durante a revisão: ${item.atual.titulo}`);
    }
  }, { timeout: 60000 });
  const after = await historicos();
  assert.deepEqual(after, before, 'O histórico mudou durante a execução; confira o backup e eventuais atividades simultâneas.');
  const restantes = stored.filter(item => !catalogo.some(aula => aula.id === item.id));
  for (const item of restantes) {
    const atual = await prisma.aula.findUniqueOrThrow({ where: { id: item.id }, select: { conteudo: true } });
    assert.equal(atual.conteudo, item.conteudo);
  }
  console.log(JSON.stringify({ aulasAtualizadas: pendentes.length, outrasAulasPreservadas: restantes.length, historicosPreservados: true, backup }));
}

main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
