import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

const { migrationDatabaseUrl } = require('./scripts/prisma-connection.cjs');
config({ quiet: true });

// Configuração exclusiva do CLI. O servidor continua usando DATABASE_URL com pool.
// Permite gerar o cliente em CI sem exigir credenciais de banco.
export default process.env.DATABASE_URL
  ? defineConfig({ schema: 'prisma/schema.prisma', engine: 'classic',
    datasource: { url: migrationDatabaseUrl(process.env) } })
  : defineConfig({ schema: 'prisma/schema.prisma' });
