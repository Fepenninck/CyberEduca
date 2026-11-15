import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { buildCatalog } from '../prisma/content/catalog';
import { aulasBasicas } from '../prisma/content/modulo-basico';
import { boasVindas } from '../prisma/content/boas-vindas';

async function main() {
  const original = new URL(process.env.DATABASE_URL!);
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(original.hostname));
  const name = `cybereduca_test_${randomUUID().replaceAll('-', '')}`;
  assert.match(name, /^cybereduca_test_[a-f0-9]{32}$/);
  const url = new URL(original);
  url.pathname = `/${name}`;
  const admin = new PrismaClient();
  const prisma = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  let created = false;
  try {
    await admin.$executeRawUnsafe(`CREATE DATABASE "${name}"`);
    created = true;
    const migrate = spawnSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'], {
      cwd: resolve(__dirname, '..'), env: { ...process.env, DATABASE_URL: url.toString() }, encoding: 'utf8', shell: false,
    });
    assert.equal(migrate.status, 0, 'Migrações precisam funcionar também em banco vazio.');
    const aulas = buildCatalog().courses.flatMap(course => course.aulas);
    const trilha = await prisma.trilha.create({ data: { titulo: 'Teste editorial', descricao: 'Fixture', ordem: 1 } });
    const materiais = new Map<string, Record<string, unknown>>();
    for (const aula of aulas) {
      const material = JSON.parse(aula.conteudo);
      const antes = { ...material, concept: 'Texto antigo.', caseStudy: 'Caso antigo.', practice: 'Atividade antiga.', campoPersonalizado: 'preservar' };
      delete antes.takeaway;
      materiais.set(aula.id, antes);
    }
    await prisma.aula.createMany({ data: aulas.map((aula, index) => ({ id: aula.id, titulo: aula.titulo, ordem: index + 1,
      trilhaId: trilha.id, conteudo: JSON.stringify(materiais.get(aula.id)) })) });
    const welcomeId = 'b1a2c3d4-1111-2222-3333-444444444441';
    await prisma.aula.create({ data: { id: welcomeId, titulo: 'Boas-vindas', ordem: 100, trilhaId: trilha.id, conteudo: 'Boas-vindas antigas' } });
    for (const [index, aula] of aulasBasicas.entries()) await prisma.aula.create({ data: { ...aula, ordem: 200 + index, trilhaId: trilha.id } });
    const custom = await prisma.aula.create({ data: { titulo: 'Aula do administrador', ordem: 300, trilhaId: trilha.id, conteudo: 'Conteúdo personalizado intacto.' } });
    const user = await prisma.usuario.create({ data: { nome: 'Aluno de teste', email: 'editorial@exemplo.invalid' } });
    const progress = await prisma.progressoAula.create({ data: { usuarioId: user.id, aulaId: aulas[0].id } });
    const quiz = await prisma.quiz.create({ data: { titulo: 'Quiz preservado', descricao: 'Fixture', aulaId: aulas[0].id } });
    const quizAttempt = await prisma.tentativaQuiz.create({ data: { usuarioId: user.id, quizId: quiz.id, totalQuestoes: 1, totalAcertos: 1 } });
    const exam = await prisma.prova.create({ data: { titulo: 'Prova preservada', trilhaId: trilha.id } });
    const examAttempt = await prisma.tentativaProva.create({ data: { usuarioId: user.id, provaId: exam.id, totalQuestoes: 10, totalAcertos: 6, nota: 6, concluidoEm: new Date() } });
    const sql = readFileSync(resolve(__dirname, '../prisma/migrations/20261115223000_revisao_editorial_aulas/migration.sql'), 'utf8');
    await prisma.$executeRawUnsafe(sql);
    for (const aula of aulas) {
      const row = await prisma.aula.findUniqueOrThrow({ where: { id: aula.id } });
      const material = JSON.parse(row.conteudo);
      const esperado = JSON.parse(aula.conteudo);
      for (const campo of ['concept', 'caseStudy', 'practice', 'takeaway']) assert.equal(material[campo], esperado[campo]);
      for (const campo of ['diagram', 'video', 'supplement', 'readings', 'glossary', 'campoPersonalizado']) {
        assert.deepEqual(material[campo], materiais.get(aula.id)![campo]);
      }
    }
    assert.equal((await prisma.aula.findUniqueOrThrow({ where: { id: welcomeId } })).conteudo, boasVindas);
    for (const aula of aulasBasicas) assert.equal((await prisma.aula.findUniqueOrThrow({ where: { id: aula.id } })).conteudo, aula.conteudo);
    assert.deepEqual(await prisma.aula.findUniqueOrThrow({ where: { id: custom.id } }), custom);
    assert.deepEqual(await prisma.progressoAula.findUniqueOrThrow({ where: { id: progress.id } }), progress);
    assert.deepEqual(await prisma.tentativaQuiz.findUniqueOrThrow({ where: { id: quizAttempt.id } }), quizAttempt);
    assert.deepEqual(await prisma.tentativaProva.findUniqueOrThrow({ where: { id: examAttempt.id } }), examAttempt);
    assert.deepEqual(await prisma.usuario.findUniqueOrThrow({ where: { id: user.id } }), user);
    assert.equal(await prisma.aula.count(), 98);

    // migrate deploy não reaplica o conteúdo: edições posteriores do administrador ficam intactas.
    await prisma.aula.update({ where: { id: aulas[0].id }, data: { conteudo: 'Edição posterior do administrador.' } });
    const repeat = spawnSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'], {
      cwd: resolve(__dirname, '..'), env: { ...process.env, DATABASE_URL: url.toString() }, encoding: 'utf8', shell: false,
    });
    assert.equal(repeat.status, 0);
    assert.equal((await prisma.aula.findUniqueOrThrow({ where: { id: aulas[0].id } })).conteudo, 'Edição posterior do administrador.');
    console.log('Migração editorial validada: 91 aulas e introdução atualizadas; mídias, trilha 1, dados personalizados, usuários e históricos preservados; deploy repetido não sobrescreve edições.');
  } finally {
    await prisma.$disconnect();
    if (created) await admin.$executeRawUnsafe(`DROP DATABASE "${name}" WITH (FORCE)`);
    await admin.$disconnect();
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
