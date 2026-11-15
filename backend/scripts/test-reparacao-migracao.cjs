const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');
const { recover, renderTarget, MIGRATION, IDS } = require('./reparar-migracao-login.cjs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });

const backend = path.resolve(__dirname, '..');
const host = 'ep-misty-mud-ac7fmdhq-pooler.sa-east-1.aws.neon.tech';
assert.equal(renderTarget({ RENDER: 'true', DATABASE_URL: `postgresql://x:x@${host}/neondb` }), true);
assert.equal(renderTarget({ DATABASE_URL: `postgresql://x:x@${host}/neondb` }), false);
assert.equal(renderTarget({ RENDER: 'true', DATABASE_URL: 'postgresql://x:x@localhost/neondb' }), false);
assert.equal(renderTarget({ RENDER: 'true', IS_PULL_REQUEST: 'true', DATABASE_URL: `postgresql://x:x@${host}/neondb` }), false);

async function main() {
  const original = new URL(process.env.DATABASE_URL);
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(original.hostname), 'Use apenas PostgreSQL local para testar.');
  const name = `cybereduca_test_${randomUUID().replaceAll('-', '')}`;
  assert.match(name, /^cybereduca_test_[a-f0-9]{32}$/);
  const target = new URL(original);
  target.pathname = `/${name}`;
  const env = { ...process.env, DATABASE_URL: target.toString(), NODE_ENV: 'test' };
  const admin = new PrismaClient();
  let prisma;
  let created = false;
  const cli = args => spawnSync(process.execPath, [require.resolve('prisma/build/index.js'), ...args],
    { cwd: backend, env, encoding: 'utf8', shell: false });
  try {
    await admin.$executeRawUnsafe(`CREATE DATABASE "${name}"`);
    created = true;
    prisma = new PrismaClient({ datasources: { db: { url: target.toString() } } });
    const fixture = path.resolve(backend, '../.local/backups', `teste-recuperacao-${randomUUID()}`);
    fs.mkdirSync(path.join(fixture, 'migrations'), { recursive: true });
    fs.copyFileSync(path.join(backend, 'prisma/schema.prisma'), path.join(fixture, 'schema.prisma'));
    const migrations = path.join(backend, 'prisma/migrations');
    fs.copyFileSync(path.join(migrations, 'migration_lock.toml'), path.join(fixture, 'migrations/migration_lock.toml'));
    for (const dir of fs.readdirSync(migrations, { withFileTypes: true })) {
      if (dir.isDirectory() && dir.name < MIGRATION) fs.cpSync(path.join(migrations, dir.name), path.join(fixture, 'migrations', dir.name), { recursive: true });
    }
    assert.equal(cli(['migrate', 'deploy', '--schema', path.join(fixture, 'schema.prisma')]).status, 0);
    const originalEmail = 'casetest1794754146@hackerai-test.dev';
    const realId = randomUUID();
    for (const [id, nome, email] of [
      [IDS[0], 'Case Low', originalEmail], [IDS[1], 'Case Up', originalEmail.toUpperCase()],
      [realId, 'Aluno preservado', 'aluno@exemplo.invalid'],
    ]) {
      await prisma.$executeRawUnsafe('INSERT INTO "Usuario" (id,nome,email,papel,"criadoEm","atualizadoEm") VALUES ($1,$2,$3,\'USUARIO\',now(),now())', id, nome, email);
    }
    assert.notEqual(cli(['migrate', 'deploy']).status, 0, 'O conflito precisa reproduzir uma falha real de migração.');
    const backups = [];
    let resolves = 0;
    const options = {
      backup: async users => backups.push(users),
      resolveMigration: async migration => {
        resolves++;
        assert.equal(cli(['migrate', 'resolve', '--rolled-back', migration]).status, 0);
      },
    };
    const track = await prisma.trilha.create({ data: { titulo: 'Fixture', descricao: 'Fixture', ordem: 1 } });
    const lesson = await prisma.aula.create({ data: { titulo: 'Fixture', conteudo: 'Preservar', ordem: 1, trilhaId: track.id } });
    const progress = await prisma.progressoAula.create({ data: { usuarioId: IDS[0], aulaId: lesson.id } });
    await assert.rejects(recover(prisma, options), /dados associados/);
    assert.equal(await prisma.$queryRawUnsafe('SELECT id FROM "Usuario"').then(rows => rows.length), 3);
    assert.equal(resolves, 0);
    assert.equal(backups.length, 0);
    await prisma.progressoAula.update({ where: { id: progress.id }, data: { usuarioId: realId } });

    // Uma aplicação parcial exige análise própria e não pode disparar exclusões.
    await prisma.$executeRawUnsafe('ALTER TABLE "Usuario" ADD COLUMN "senhaAlteradaEm" TIMESTAMP(3)');
    await assert.rejects(recover(prisma, options), /alterações parciais/);
    await prisma.$executeRawUnsafe('ALTER TABLE "Usuario" DROP COLUMN "senhaAlteradaEm"');

    const outcome = await recover(prisma, options);
    assert.equal(outcome.excluidas, 2);
    assert.equal(backups.length, 1);
    assert.deepEqual(new Set(backups[0].map(user => user.id)), new Set(IDS));
    assert.equal(resolves, 1);
    assert.equal(cli(['migrate', 'deploy']).status, 0);
    assert.equal(await prisma.usuario.count(), 1);
    assert.ok(await prisma.usuario.findUnique({ where: { id: realId } }));
    assert.equal(await prisma.progressoAula.count({ where: { usuarioId: realId } }), 1);
    assert.equal((await prisma.aula.findUniqueOrThrow({ where: { id: lesson.id } })).conteudo, 'Preservar');
    assert.deepEqual(await recover(prisma, options), { status: 'sem_falha', excluidas: 0 });
    assert.equal(resolves, 1);
    console.log('Recuperação validada: P3009 reproduzido, proteção de dados, bloqueio de aplicação parcial, exclusão limitada, reaplicação e idempotência.');
  } finally {
    if (prisma) await prisma.$disconnect();
    if (created) await admin.$executeRawUnsafe(`DROP DATABASE "${name}" WITH (FORCE)`);
    await admin.$disconnect();
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
