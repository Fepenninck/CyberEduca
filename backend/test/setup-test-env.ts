import { config } from 'dotenv';

config({
  path: '.env.test.local',
  override: true,
  quiet: true,
});

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