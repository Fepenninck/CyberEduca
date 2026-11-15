const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');
const { resolve } = require('node:path');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: resolve(__dirname, '../.env'), quiet: true });

async function main() {
  const source = new URL(process.env.DATABASE_URL);
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(source.hostname));
  const name = `cybereduca_test_${randomUUID().replaceAll('-', '')}`;
  assert.match(name, /^cybereduca_test_[a-f0-9]{32}$/);
  const target = new URL(source); target.pathname = `/${name}`;
  const env = { ...process.env, DATABASE_URL: target.toString(), DIRECT_URL: target.toString(), DATABASE_URL_UNPOOLED: '', NODE_ENV: 'test' };
  const admin = new PrismaClient();
  const lockedUrl = new URL(target); lockedUrl.searchParams.set('connection_limit', '1');
  const locker = new PrismaClient({ datasources: { db: { url: lockedUrl.toString() } } });
  let created = false;
  let timer;
  let locked = false;
  async function release() {
    if (locked) {
      await locker.$queryRawUnsafe('SELECT pg_advisory_unlock(72707369) AS unlocked');
      locked = false;
    }
  }
  try {
    await admin.$executeRawUnsafe(`CREATE DATABASE "${name}"`); created = true;
    const initial = spawnSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'],
      { cwd: resolve(__dirname, '..'), env, encoding: 'utf8', shell: false });
    assert.equal(initial.status, 0);
    await locker.$queryRawUnsafe('SELECT pg_advisory_lock(72707369)::text AS locked'); locked = true;
    const result = await new Promise((done, reject) => {
      const child = spawn(process.execPath, [resolve(__dirname, 'migrate-deploy.cjs')],
        { cwd: resolve(__dirname, '..'), env, shell: false, windowsHide: true });
      let output = '';
      child.stdout.on('data', chunk => { output += chunk; });
      child.stderr.on('data', chunk => { output += chunk; });
      child.on('error', reject);
      child.on('close', status => done({ status, output }));
      // Força uma tentativa a atingir os 10 segundos de timeout reais do Prisma.
      timer = setTimeout(() => release().catch(reject), 15000);
    });
    assert.equal(result.status, 0, result.output);
    assert.ok(result.output.includes('P1002'));
    assert.ok(result.output.includes('Nova tentativa'));
    assert.ok(result.output.includes('No pending migrations'));
    console.log('PostgreSQL real: trava concorrente reproduziu P1002; retry aguardou sua liberação e concluiu sem forçar ou encerrar sessões.');
  } finally {
    clearTimeout(timer);
    await release();
    await locker.$disconnect();
    if (created) await admin.$executeRawUnsafe(`DROP DATABASE "${name}" WITH (FORCE)`);
    await admin.$disconnect();
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
