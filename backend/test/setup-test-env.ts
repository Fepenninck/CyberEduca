import { config } from 'dotenv';

const bancoTemporario = process.env.PFC_TEST_DATABASE_URL;

config({
  path: '.env.test.local',
  override: true,
  quiet: true,
});

if (bancoTemporario) {
  const conexao = new URL(bancoTemporario);
  if (
    !['postgres:', 'postgresql:'].includes(conexao.protocol) ||
    !['localhost', '127.0.0.1', '[::1]'].includes(conexao.hostname) ||
    !/^\/cybereduca_test_[a-f0-9]{32}$/.test(conexao.pathname)
  ) {
    throw new Error('Conexão temporária de teste inválida.');
  }
  process.env.DATABASE_URL = bancoTemporario;
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL não foi definida no arquivo .env.test.local',
  );
}

const nomeBanco = new URL(
  process.env.DATABASE_URL,
).pathname.toLowerCase();

if (!nomeBanco.includes('test')) {
  throw new Error(
    `Banco recusado: ${nomeBanco}. Os testes de integração exigem um banco de teste.`,
  );
}
