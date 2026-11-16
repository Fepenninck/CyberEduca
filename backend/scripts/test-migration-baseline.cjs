const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

// Uma revisão antiga é testada antes dos snapshots posteriores que já povoam o catálogo.
function baselineBefore(cutoff) {
  const backend = path.resolve(__dirname, '..');
  const dir = path.resolve(backend, '../.local/backups', `baseline-${randomUUID()}`);
  fs.mkdirSync(path.join(dir, 'migrations'), { recursive: true });
  fs.copyFileSync(path.join(backend, 'prisma/schema.prisma'), path.join(dir, 'schema.prisma'));
  const source = path.join(backend, 'prisma/migrations');
  fs.copyFileSync(path.join(source, 'migration_lock.toml'), path.join(dir, 'migrations/migration_lock.toml'));
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name < cutoff) fs.cpSync(path.join(source, entry.name), path.join(dir, 'migrations', entry.name), { recursive: true });
  }
  return path.join(dir, 'schema.prisma');
}
module.exports = { baselineBefore };
