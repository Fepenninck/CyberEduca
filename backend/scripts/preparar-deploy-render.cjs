const { renderTarget, main: recoverLogin } = require('./reparar-migracao-login.cjs');
const { main: deployMigrations } = require('./migrate-deploy.cjs');

async function main() {
  if (!renderTarget(process.env)) {
    console.log('[deploy] Fora do Render de produção autorizado; banco não alterado.');
    return;
  }
  await recoverLogin();
  // Executa antes do comando antigo do Render, com conexão direta e repetição limitada.
  // O migrate deploy seguinte encontra o banco atualizado e não reaplica conteúdo.
  await deployMigrations();
}

main().catch(() => {
  console.error('[deploy] Preparação interrompida. Confira o diagnóstico das migrações acima.');
  process.exitCode = 1;
});
