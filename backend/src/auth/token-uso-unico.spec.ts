import { describe, expect, it } from '@jest/globals';
import { gerarTokenUsoUnico, hashToken, reenvioMuitoRapido } from './token-uso-unico';

describe('token de uso único', () => {
  it('gera tokens diferentes e guarda apenas o hash', () => {
    const primeiro = gerarTokenUsoUnico();
    const segundo = gerarTokenUsoUnico();

    expect(primeiro.token).not.toBe(segundo.token);
    expect(primeiro.hash).toBe(hashToken(primeiro.token));
    expect(primeiro.hash).not.toContain(primeiro.token);
  });

  it('bloqueia reenvio nos primeiros 30 segundos', () => {
    const agora = Date.now();
    const validade = 5 * 60 * 1000;

    expect(reenvioMuitoRapido(null, validade, agora)).toBe(false);
    expect(reenvioMuitoRapido(new Date(agora + validade - 10_000), validade, agora)).toBe(true);
    expect(reenvioMuitoRapido(new Date(agora + validade - 31_000), validade, agora)).toBe(false);
  });
});
