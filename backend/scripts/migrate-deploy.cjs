const { spawnSync } = require('node:child_process');
const { resolve } = require('node:path');
const { migrationDatabaseUrl } = require('./prisma-connection.cjs');

function lockTimeout(output) {
  return output.includes('P1002') && /advisory lock|pg_advisory_lock\(72707369\)/i.test(output);
}

async function deployMigrations({ run, wait, report, attempts = 4 }) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const result = run();
    if (result.status === 0) return result;
    const output = (result.stdout || '') + (result.stderr || '');
    if (!lockTimeout(output) || attempt === attempts) return result;
    report(`[migrações] Trava ocupada. Nova tentativa ${attempt + 1}/${attempts} em 3 segundos.`);
    await wait(3000);
  }
}

async function main() {
  require('dotenv').config({ path: resolve(__dirname, '../.env'), quiet: true });
  const env = { ...process.env, DATABASE_URL: migrationDatabaseUrl(process.env) };
  const result = await deployMigrations({
    run: () => {
      const attempt = spawnSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'],
        { cwd: resolve(__dirname, '..'), env, encoding: 'utf8', shell: false });
      if (attempt.stdout) process.stdout.write(attempt.stdout);
      if (attempt.stderr) process.stderr.write(attempt.stderr);
      return attempt;
    },
    wait: ms => new Promise(done => setTimeout(done, ms)),
    report: message => console.log(message),
  });
  if (result.error || result.status !== 0) throw new Error('Migrações não concluídas; confira o diagnóstico acima. Nenhuma proteção de trava foi desativada.');
}

module.exports = { main, deployMigrations, lockTimeout };
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
