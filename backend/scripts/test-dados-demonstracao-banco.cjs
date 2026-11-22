const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');
const { seedDemo, DOMAIN, TABLES } = require('./dados-demonstracao.cjs');

async function main() {
  const backend = path.resolve(__dirname, '..');
  const parsed = require('dotenv').config({ path: path.join(backend, '.env'), quiet: true, processEnv: {} }).parsed;
  const connection = new URL(parsed?.DATABASE_URL);
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(connection.hostname), 'Teste restrito a PostgreSQL local.');
  const database = `cybereduca_test_demo_${randomUUID().replaceAll('-', '')}`;
  assert.match(database, /^cybereduca_test_demo_[a-f0-9]{32}$/);
  const target = new URL(connection);
  target.pathname = `/${database}`;
  const admin = new PrismaClient({ datasources: { db: { url: connection.toString() } } });
  let db;
  let created = false;
  try {
    await admin.$executeRawUnsafe(`CREATE DATABASE "${database}"`);
    created = true;
    const migration = spawnSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'], {
      cwd: backend, env: { ...process.env, DATABASE_URL: target.toString(), DIRECT_URL: target.toString(), DATABASE_URL_UNPOOLED: '', NODE_ENV: 'test' }, encoding: 'utf8', shell: false,
    });
    assert.equal(migration.status, 0, 'Migrações do banco temporário precisam concluir.');
    db = new PrismaClient({ datasources: { db: { url: target.toString() } } });
    const preserved = await db.usuario.create({ data: { nome: 'Conta existente preservada', email: 'preservar@example.invalid', papel: 'USUARIO' } });
    const administrator = await db.usuario.findFirstOrThrow({ where: { papel: 'ADMIN' } });
    const initialUsers = await db.usuario.count();
    const initialStudents = await db.usuario.count({ where: { papel: { in: ['USUARIO', 'ALUNO'] } } });
    const expectedNew = 1000 - initialStudents;
    const now = new Date();
    const reports = [];
    const report = message => reports.push(message);
    const dry = await seedDemo(db, { now, report });
    assert.equal(dry.planned.usuario, expectedNew);
    assert.equal(await db.usuario.count(), initialUsers, 'Planejamento não escreve.');
    const loads = await Promise.all([
      seedDemo(db, { apply: true, now, report }),
      seedDemo(db, { apply: true, now, report }),
    ]);
    assert.equal(loads.reduce((sum, result) => sum + result.created, 0), expectedNew);
    assert.ok(loads.every(result => result.after === 1000));
    assert.equal(await db.usuario.count(), initialUsers + expectedNew);
    assert.deepEqual(await db.usuario.findUnique({ where: { id: preserved.id } }), preserved);
    assert.deepEqual(await db.usuario.findUnique({ where: { id: administrator.id } }), administrator);
    const counts = async () => Object.fromEntries(await Promise.all(TABLES.map(async table => [table, await db[table].count()])));
    const beforeRepeat = await counts();
    assert.equal((await seedDemo(db, { apply: true, now, report })).created, 0);
    assert.deepEqual(await counts(), beforeRepeat, 'Segunda execução não duplica atividades.');
    const chronology = await db.$queryRaw`
      SELECT u.email, u."criadoEm", a.data, a.tipo FROM (
        SELECT p."usuarioId", p."dataConclusao" AS data, 'aula' AS tipo FROM "ProgressoAula" p
        UNION ALL SELECT "usuarioId", "concluidoEm", 'quiz' FROM "TentativaQuiz"
        UNION ALL SELECT "usuarioId", "concluidoEm", 'prova' FROM "TentativaProva"
        UNION ALL SELECT "usuarioId", "criadoEm", 'simulação' FROM "ResultadoSimulacao"
        UNION ALL SELECT "atorId", "criadoEm", 'auditoria' FROM "LogAuditoria"
      ) a JOIN "Usuario" u ON u.id = a."usuarioId"
      WHERE u.email LIKE ${`%@${DOMAIN}`} AND (a.data < u."criadoEm" OR a.data > ${now.toISOString()}::timestamp)`;
    assert.deepEqual(chronology, [], 'Cronologia inválida nos dados sintéticos.');
    const distribution = await db.$queryRaw`
      SELECT COUNT(DISTINCT ("criadoEm" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date)::int AS dias,
        COUNT(*) FILTER (WHERE "senhaHash" IS NOT NULL OR "googleId" IS NOT NULL OR "termosAceitosEm" IS NOT NULL)::int AS credenciais
      FROM "Usuario" WHERE email LIKE ${`%@${DOMAIN}`}`;
    assert.ok(distribution[0].dias > 150);
    assert.equal(distribution[0].credenciais, 0);
    const incorrectTotals = await db.$queryRaw`
      SELECT COUNT(*)::int AS total FROM "TentativaProva" t
      WHERE t."totalQuestoes" <> (SELECT COUNT(*) FROM "RespostaProva" r WHERE r."tentativaId" = t.id)
        OR t."totalAcertos" <> (SELECT COUNT(*) FROM "RespostaProva" r WHERE r."tentativaId" = t.id AND r.acertou)`;
    assert.equal(incorrectTotals[0].total, 0);
    require('ts-node').register({ project: path.join(backend, 'tsconfig.json'), transpileOnly: true, compilerOptions: { rootDir: backend } });
    const { AdminDashboardService } = require('../src/admin/admin-dashboard.service.ts');
    const { AdminService } = require('../src/admin/admin.service.ts');
    const dashboardService = new AdminDashboardService(db);
    const dashboard = await dashboardService.buscarResumoDashboard();
    assert.equal(dashboard.totalUsuarios, initialUsers + expectedNew);
    assert.ok(dashboard.acessos.length > 0 && dashboard.aulasConcluidas.length > 0 && dashboard.conclusoesTrilhas.length > 0);
    assert.ok(dashboard.progressoTrilhas.emAndamento > 0 && dashboard.progressoTrilhas.concluidas > 0);
    const services = new AdminService(dashboardService, {}, db);
    const exams = await services.listarResultadosProvas();
    assert.equal(exams.length, beforeRepeat.tentativaProva, 'Resumo e tentativas não contam a mesma prova duas vezes.');
    assert.ok(exams.some(exam => exam.aprovado === false) && exams.some(exam => exam.aprovado === true));
    const days = items => new Set(items.map(item => new Date(item.criadoEm).toISOString().slice(0, 10))).size;
    assert.ok(days(dashboard.acessos) > 60 && days(dashboard.aulasConcluidas) > 60 && days(exams) > 60);
    console.log(JSON.stringify({ teste: 'carga em banco temporário e consultas reais dos dashboards', usuarios: 1001, diasCadastros: distribution[0].dias, registros: beforeRepeat, diasProvas: days(exams), repeticaoSemDuplicatas: true, contaExistentePreservada: true }));
  } finally {
    if (db) await db.$disconnect();
    if (created) await admin.$executeRawUnsafe(`DROP DATABASE "${database}" WITH (FORCE)`);
    await admin.$disconnect();
  }
}

main().catch(error => {
  const diagnostic = String(error.message).replace(/postgres(?:ql)?:\/\/[^\s"']+/g, '[conexão omitida]').slice(-2500);
  console.error(`Teste da carga falhou (${error.code || error.name}).`, diagnostic);
  if (error.code === 'ERR_ASSERTION') console.error(error.stack.split('\n').filter(line => line.trim().startsWith('at ')).join('\n'));
  process.exitCode = 1;
});
