const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');
const { snapshotCatalog } = require('./snapshot-catalogo.cjs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });

async function main() {
  const url = new URL(process.env.DATABASE_URL);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error('A exportação deve ler somente o banco local.');
  const prisma = new PrismaClient();
  try {
    const tables = await prisma.$transaction(snapshotCatalog, { isolationLevel: 'RepeatableRead', timeout: 60000 });
    const file = path.resolve(__dirname, '../prisma/content/catalogo-local-20261115.json');
    if (fs.existsSync(file)) throw new Error('Snapshot existente: crie outra revisão em vez de alterar a versão publicada.');
    fs.writeFileSync(file, JSON.stringify({ revisao: 'catalogo-local-20261115', tables }, null, 2) + '\n', { flag: 'wx' });
    console.log(JSON.stringify({ exportado: Object.fromEntries(tables.map(table => [table.table, table.rows.length])), usuariosEHistoricosIncluidos: false }));
  } finally { await prisma.$disconnect(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
