import { Transform } from 'class-transformer';

export const NormalizarNome = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );
