function parseConnection(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error('Conexão PostgreSQL inválida.'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('A conexão de migração deve usar PostgreSQL.');
  return url;
}

function directHostname(hostname) {
  return hostname.endsWith('.neon.tech') ? hostname.replace(/-pooler(?=\.)/, '') : hostname;
}

function migrationDatabaseUrl(env) {
  const app = parseConnection(env.DATABASE_URL);
  const explicit = env.DATABASE_URL_UNPOOLED || env.DIRECT_URL;
  const target = explicit ? parseConnection(explicit) : new URL(app);
  if (explicit && (directHostname(target.hostname) !== directHostname(app.hostname) || target.pathname !== app.pathname)) {
    throw new Error('A conexão direta deve apontar para o mesmo endpoint e banco da aplicação.');
  }
  target.hostname = directHostname(target.hostname);
  if (target.hostname.endsWith('.neon.tech')) {
    target.searchParams.delete('pgbouncer');
    target.searchParams.delete('pool_timeout');
    target.searchParams.delete('connection_limit');
    if (!target.searchParams.has('connect_timeout')) target.searchParams.set('connect_timeout', '30');
  }
  return target.toString();
}

module.exports = { migrationDatabaseUrl };
