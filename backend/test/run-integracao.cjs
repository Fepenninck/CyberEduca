const { randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { config } = require('dotenv');
const { PrismaClient } = require('@prisma/client');

process.chdir(path.resolve(__dirname, '..'));

function executar(arquivo, argumentos, env, opcoesNode = []) {
  const resultado = spawnSync(process.execPath, [...opcoesNode, arquivo, ...argumentos], {
    stdio: 'inherit',
    env,
    shell: false,
  });
  if (resultado.error || resultado.status !== 0) {
    throw new Error(`Falha em ${path.basename(arquivo)} (código ${resultado.status}).`);
  }
}

async function main() {
  // Lê somente o arquivo de teste, sem aproveitar DATABASE_URL do terminal/.env.
  const configuracao = config({ path: '.env.test.local', quiet: true, processEnv: {} });
  if (configuracao.error || !configuracao.parsed?.DATABASE_URL) {
    throw new Error('Crie .env.test.local com a conexão PostgreSQL local de teste.');
  }
  const conexao = new URL(configuracao.parsed.DATABASE_URL);
  if (!['postgres:', 'postgresql:'].includes(conexao.protocol) ||
      !['localhost', '127.0.0.1', '[::1]'].includes(conexao.hostname) ||
      !conexao.pathname.toLowerCase().includes('test')) {
    throw new Error('Conexão recusada: use PostgreSQL local com nome de banco contendo test.');
  }

  const nome = `cybereduca_test_${randomUUID().replaceAll('-', '')}`;
  // O identificador SQL é gerado internamente, nunca recebido do usuário.
  if (!/^cybereduca_test_[a-f0-9]{32}$/.test(nome)) throw new Error('Nome temporário inválido.');
  const temporaria = new URL(conexao);
  temporaria.pathname = `/${nome}`;
  const env = {
    ...process.env,
    ...configuracao.parsed,
    NODE_ENV: 'test',
    DATABASE_URL: temporaria.toString(),
    PFC_TEST_DATABASE_URL: temporaria.toString(),
  };
  const admin = new PrismaClient({ datasources: { db: { url: conexao.toString() } } });
  let criado = false;
  try {
    await admin.$executeRawUnsafe(`CREATE DATABASE "${nome}"`);
    criado = true;
    console.log(`Banco temporário criado: ${nome}`);
    executar(require.resolve('prisma/build/index.js'), ['migrate', 'deploy'], env);
    executar(require.resolve('jest/bin/jest'), [
      '--config', './test/jest-integracao.json', ...process.argv.slice(2),
    ], env, ['--experimental-vm-modules']);
  } finally {
    try {
      if (criado) {
        await admin.$executeRawUnsafe(`DROP DATABASE "${nome}" WITH (FORCE)`);
        console.log(`Banco temporário descartado: ${nome}`);
      }
    } finally {
      await admin.$disconnect();
    }
  }
}

main().catch(() => {
  // Não imprime exceções de conexão que possam conter credenciais.
  console.error('Execução não concluída. Confira os erros acima, a conexão local e a permissão CREATEDB.');
  process.exitCode = 1;
});
