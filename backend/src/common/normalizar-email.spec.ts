import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { LoginDto } from '../auth/dto/login.dto';
import { RegisterDto } from '../auth/dto/register.dto';
import { UpdateProfileDto } from '../usuarios/dto/update-profile.dto';

describe('NormalizarEmail', () => {
  it('normaliza o nome e rejeita nomes vazios, sÃ³ com espaÃ§os ou menores que dois caracteres', () => {
    const valido = plainToInstance(RegisterDto, { name: '  Ana Silva  ', email: 'ana@test.dev', password: 'x' });
    expect(valido.name).toBe('Ana Silva');
    expect(validateSync(valido).map(error => error.property)).not.toContain('name');

    for (const name of ['', '   ', ' A ']) {
      const cadastro = plainToInstance(RegisterDto, { name, email: 'ana@test.dev', password: 'x' });
      expect(cadastro.name).toBe(name.trim());
      expect(validateSync(cadastro).map(error => error.property)).toContain('name');
    }
  });

  it('remove espaços e converte o e-mail do login para minúsculas', () => {
    const dto = plainToInstance(LoginDto, { email: '  Thiago@X.com ', password: 'x' });

    expect(dto.email).toBe('thiago@x.com');
  });

  it('normaliza o e-mail no cadastro e na atualização de perfil', () => {
    const cadastro = plainToInstance(RegisterDto, { name: 'Ana', email: 'ANA@Test.Dev', password: 'x' });
    const perfil = plainToInstance(UpdateProfileDto, { email: ' Ana@Test.dev' });

    expect(cadastro.email).toBe('ana@test.dev');
    expect(perfil.email).toBe('ana@test.dev');
  });

  it('mantém valores que não são texto para a validação tratar', () => {
    const dto = plainToInstance(LoginDto, { email: 123, password: 'x' });

    expect(dto.email).toBe(123);
  });
});
