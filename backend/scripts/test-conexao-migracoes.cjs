const assert = require('node:assert/strict');
const { migrationDatabaseUrl } = require('./prisma-connection.cjs');
const { deployMigrations, lockTimeout } = require('./migrate-deploy.cjs');

async function main() {
  const pooled = 'postgresql://usuario:senha@ep-teste-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&pgbouncer=true&connection_limit=5';
  const env = { DATABASE_URL: pooled };
  const direct = new URL(migrationDatabaseUrl(env));
  assert.equal(direct.hostname, 'ep-teste.sa-east-1.aws.neon.tech');
  assert.equal(direct.searchParams.get('sslmode'), 'require');
  assert.equal(direct.searchParams.get('channel_binding'), 'require');
  assert.equal(direct.searchParams.get('connect_timeout'), '30');
  assert.equal(direct.searchParams.has('pgbouncer'), false);
  assert.equal(direct.searchParams.has('connection_limit'), false);
  assert.equal(env.DATABASE_URL, pooled, 'A conexão da aplicação não pode ser alterada.');
  const local = 'postgresql://postgres:senha@localhost:5433/cybereduca_test?schema=public';
  assert.equal(migrationDatabaseUrl({ DATABASE_URL: local }), local);
  assert.equal(new URL(migrationDatabaseUrl({ DATABASE_URL: pooled, DIRECT_URL: direct.toString() })).hostname, direct.hostname);
  assert.throws(() => migrationDatabaseUrl({ DATABASE_URL: local, DIRECT_URL: direct.toString() }), /mesmo endpoint e banco/);
  assert.throws(() => migrationDatabaseUrl({ DATABASE_URL: pooled, DIRECT_URL: direct.toString().replace('/neondb', '/outro') }), /mesmo endpoint e banco/);
  assert.throws(() => migrationDatabaseUrl({ DATABASE_URL: 'invalido' }), /inválida/);
  const timeout = { status: 1, stderr: 'Error P1002: Timed out trying to acquire a postgres advisory lock (SELECT pg_advisory_lock(72707369))' };
  assert.equal(lockTimeout(timeout.stderr), true);
  assert.equal(lockTimeout('P1002: database connection timed out'), false);
  let calls = 0;
  const waits = [];
  const reports = [];
  const success = await deployMigrations({ run: () => ++calls === 1 ? timeout : { status: 0 },
    wait: async ms => waits.push(ms), report: value => reports.push(value) });
  assert.equal(success.status, 0);
  assert.equal(calls, 2);
  assert.deepEqual(waits, [3000]);
  assert.equal(reports.length, 1);
  for (const stderr of ['P3009: failed migration', 'P3018: duplicate key', 'P1002: connection timed out']) {
    let executions = 0;
    const result = await deployMigrations({ run: () => { executions++; return { status: 1, stderr }; },
      wait: async () => assert.fail('Erro definitivo não deve ser repetido.'), report: () => {} });
    assert.equal(result.status, 1);
    assert.equal(executions, 1);
  }
  calls = 0;
  const failure = await deployMigrations({ run: () => { calls++; return timeout; }, wait: async () => {}, report: () => {} });
  assert.equal(failure.status, 1);
  assert.equal(calls, 4);
  console.log('Conexão direta e retries verificados: pool da aplicação preservado; SSL mantido; somente timeout de trava é repetido; nenhuma trava é desativada.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
