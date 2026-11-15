import { createHash, randomBytes } from 'node:crypto';

export const VALIDADE_LINK_LOGIN_MS = 5 * 60 * 1000;
export const VALIDADE_LINK_RECUPERACAO_MS = 15 * 60 * 1000;
export const INTERVALO_REENVIO_MS = 30 * 1000;

export function gerarTokenUsoUnico() {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function reenvioMuitoRapido(expiraEm: Date | null, validadeMs: number, agora = Date.now()) {
  if (!expiraEm) return false;
  const emitidoEm = expiraEm.getTime() - validadeMs;
  return agora - emitidoEm < INTERVALO_REENVIO_MS;
}
