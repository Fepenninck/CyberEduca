import { Transform } from 'class-transformer';

export const NormalizarEmail = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value));
