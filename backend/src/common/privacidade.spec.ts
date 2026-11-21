import { describe, expect, it } from '@jest/globals';
import { ValidationPipe } from '@nestjs/common';
import { mascararEmail } from './privacidade';
import { AtualizarUsuarioAdminDto } from '../admin/dto/atualizar-usuario-admin.dto';

describe('Privacidade administrativa', () => {
  it.each([
    ['felipe@gmail.com', 'fe***@gmail.com'],
    ['ab@example.com', 'a***@example.com'],
    ['a@example.com', '***@example.com'],
    ['invalido', '***'],
  ])('mascara %s sem revelar todo o identificador', (email, esperado) => {
    expect(mascararEmail(email)).toBe(esperado);
  });

  it('remove campos privilegiados e normaliza o email na entrada HTTP', async () => {
    const pipe = new ValidationPipe({ whitelist: true, transform: true });
    const resultado = await pipe.transform(
      {
        nome: 'Ana',
        email: ' ANA@EXAMPLE.COM ',
        papel: 'ADMIN',
        senhaHash: 'hash',
        googleId: 'externo',
      },
      { type: 'body', metatype: AtualizarUsuarioAdminDto },
    );
    expect(resultado).toEqual({ nome: 'Ana', email: 'ana@example.com' });
  });

  it('recusa emails invalidos', async () => {
    const pipe = new ValidationPipe({ whitelist: true, transform: true });
    await expect(
      pipe.transform(
        { email: 'invalido' },
        { type: 'body', metatype: AtualizarUsuarioAdminDto },
      ),
    ).rejects.toThrow();
  });
});
