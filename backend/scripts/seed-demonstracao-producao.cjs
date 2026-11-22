const { renderTarget } = require('./reparar-migracao-login.cjs');
const { migrationDatabaseUrl } = require('./prisma-connection.cjs');
const { seedDemo } = require('./dados-demonstracao.cjs');

async function main({ apply = false, env = process.env } = {}) {
  // Não carrega .env: o destino vem exclusivamente do ambiente de deploy.
  if (!renderTarget(env)) {
    console.log('[demonstração] Fora do Render de produção autorizado; banco não alterado.');
    return;
  }
  const { PrismaClient } = require('@prisma/client');
  const db = new PrismaClient({ datasources: { db: { url: migrationDatabaseUrl(env) } } });
  try {
    return await seedDemo(db, { apply });
  } finally {
    await db.$disconnect();
  }
}

module.exports = { main };
if (require.main === module) main({ apply: process.argv.includes('--apply') }).catch(error => {
  // Erros Prisma podem conter a URL de conexão; não imprimir a exceção completa.
  console.error(`[demonstração] Carga interrompida (${error.code || error.name || 'ERRO'}). Confira conexão, catálogo e migrações. Lotes concluídos são preservados e a execução pode ser retomada.`);
  process.exitCode = 1;
});
