// Recuperação pontual autorizada para o conflito de duas contas de teste.
// No Render, roda antes do migrate deploy já configurado no Build Command.
const { spawnSync } = require('node:child_process');
const { mkdirSync, writeFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { migrationDatabaseUrl } = require('./prisma-connection.cjs');

const MIGRATION = '20261115120000_normaliza_email_sessao_senha';
const EMAIL = 'casetest1794754146@hackerai-test.dev';
const ACCOUNTS = new Map([
  ['6d902044-adab-4189-bfb6-2fbdcdb5ff9d', { nome: 'Case Low', email: EMAIL }],
  ['6e699f96-94df-40e8-9f7c-e7fa52d663f8', { nome: 'Case Up', email: EMAIL.toUpperCase() }],
]);
const IDS = [...ACCOUNTS.keys()];
class RecoveryError extends Error {}

function requireCondition(condition, message) {
  if (!condition) throw new RecoveryError(message);
}

async function recover(prisma, { backup, resolveMigration }) {
  const failures = await prisma.$queryRawUnsafe(
    'SELECT migration_name, logs FROM "_prisma_migrations" WHERE finished_at IS NULL AND rolled_back_at IS NULL',
  );
  if (!failures.length) return { status: 'sem_falha', excluidas: 0 };
  requireCondition(failures.length === 1 && failures[0].migration_name === MIGRATION,
    'Existe outra migração falha. A recuperação pontual não alterou o banco.');
  const log = failures[0].logs || '';
  requireCondition(log.includes('23505') && log.includes('Usuario_email_key') && log.toLowerCase().includes(EMAIL),
    'O erro não corresponde ao conflito autorizado. Nenhuma conta foi excluída.');

  const excluidas = await prisma.$transaction(async tx => {
    await tx.$queryRawUnsafe('SELECT pg_advisory_xact_lock(1794754146)::text AS locked');
    const columns = await tx.$queryRawUnsafe(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'Usuario' AND column_name = 'senhaAlteradaEm'",
    );
    requireCondition(!columns.length,
      'A migração tem alterações parciais inesperadas. Nenhuma conta foi excluída.');
    const rows = await tx.$queryRawUnsafe(
      'SELECT row_to_json(u) AS registro FROM "Usuario" u WHERE id IN ($1, $2) FOR UPDATE', ...IDS,
    );
    const users = rows.map(row => row.registro);
    for (const user of users) {
      const expected = ACCOUNTS.get(user.id);
      requireCondition(expected && user.nome === expected.nome && user.email === expected.email &&
        user.papel === 'USUARIO' && user.googleId === null,
      'Uma conta não corresponde ao registro de teste autorizado. Nenhuma exclusão foi confirmada.');
    }
    const ids = users.map(user => user.id);
    const delegates = [tx.progressoAula, tx.tentativaQuiz, tx.tentativaPhishing,
      tx.tentativaProva, tx.resultadoProva, tx.resultadoSimulacao, tx.consultaSeguranca];
    const counts = await Promise.all(delegates.map(delegate => delegate.count({ where: { usuarioId: { in: ids } } })));
    requireCondition(counts.every(count => count === 0),
      'Uma conta possui dados associados. Nenhuma exclusão foi confirmada.');
    const otherConflicts = await tx.$queryRawUnsafe(
      'SELECT count(*)::int AS quantidade FROM (SELECT lower(trim(email)) FROM "Usuario" WHERE id NOT IN ($1, $2) GROUP BY lower(trim(email)) HAVING count(*) > 1) conflitos', ...IDS,
    );
    requireCondition(otherConflicts[0].quantidade === 0,
      'Existem outros e-mails em conflito. Nenhuma exclusão foi confirmada.');
    if (users.length) {
      await backup(users);
      // O banco mantém os registros de auditoria por onDelete: SetNull.
      const result = await tx.usuario.deleteMany({ where: { id: { in: ids } } });
      requireCondition(result.count === users.length, 'Quantidade inesperada na exclusão; transação revertida.');
    }
    const remaining = await tx.$queryRawUnsafe(
      'SELECT count(*)::int AS quantidade FROM (SELECT lower(trim(email)) FROM "Usuario" GROUP BY lower(trim(email)) HAVING count(*) > 1) conflitos',
    );
    requireCondition(remaining[0].quantidade === 0, 'Ainda há e-mails em conflito; transação revertida.');
    return users.length;
  }, { timeout: 30000 });

  // Comando oficial do Prisma: não edita diretamente a tabela de migrações.
  // Se ele falhar, a próxima execução pode retomar mesmo com as contas já removidas.
  await resolveMigration(MIGRATION);
  return { status: 'liberada_para_reaplicar', excluidas };
}

function renderTarget(env) {
  if (env.RENDER !== 'true' || env.IS_PULL_REQUEST === 'true') return false;
  let url;
  try { url = new URL(env.DATABASE_URL); } catch { return false; }
  return ['postgres:', 'postgresql:'].includes(url.protocol) && url.pathname === '/neondb' &&
    ['ep-misty-mud-ac7fmdhq-pooler.sa-east-1.aws.neon.tech',
      'ep-misty-mud-ac7fmdhq.sa-east-1.aws.neon.tech'].includes(url.hostname);
}

function prismaCommand(args) {
  const result = spawnSync(process.execPath, [require.resolve('prisma/build/index.js'), ...args],
    { cwd: resolve(__dirname, '..'), env: process.env, stdio: 'inherit', shell: false });
  requireCondition(!result.error && result.status === 0, 'O comando Prisma falhou; confira o diagnóstico acima.');
}

async function main() {
  if (!renderTarget(process.env)) {
    console.log('[recuperação login] Fora do banco Render autorizado; nenhuma alteração.');
    return;
  }
  prismaCommand(['generate']);
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient({ datasources: { db: { url: migrationDatabaseUrl(process.env) } } });
  try {
    const result = await recover(prisma, {
      backup: async users => {
        const dir = resolve(__dirname, '../../.local/backups');
        mkdirSync(dir, { recursive: true });
        const file = resolve(dir, `contas-teste-login-${Date.now()}.json`);
        writeFileSync(file, JSON.stringify({ migration: MIGRATION, usuarios: users }, null, 2), { flag: 'wx', mode: 0o600 });
        console.log('[recuperação login] Backup restrito das contas de teste criado no ambiente do build.');
      },
      resolveMigration: async migration => prismaCommand(['migrate', 'resolve', '--rolled-back', migration]),
    });
    console.log(`[recuperação login] ${result.status}; contas de teste excluídas: ${result.excluidas}.`);
  } finally { await prisma.$disconnect(); }
}

module.exports = { main, recover, renderTarget, MIGRATION, IDS };
if (require.main === module) main().catch(error => {
  console.error('[recuperação login]', error instanceof RecoveryError ? error.message :
    `Não foi possível validar o banco (${error.code || 'SEM_CODIGO'}). Recuperação interrompida.`);
  process.exitCode = 1;
});
