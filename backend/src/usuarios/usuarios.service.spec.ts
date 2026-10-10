import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import { UsuariosService } from './usuarios.service';

describe('UsuariosService', () => {
  let service: UsuariosService;

  const prismaMock = {
    usuario: {
      findUnique: jest.fn<(...args: any[]) => Promise<any>>(),
      update: jest.fn<(...args: any[]) => Promise<any>>(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(UsuariosService);
  });

  // TESTE 1: CAMINHO FELIZ
  it('deve retornar os dados públicos de um usuário existente', async () => {
    const usuario = {
      id: 'usuario-1',
      nome: 'Thiago',
      email: 'thiago@cybereduca.test',
      papel: 'USUARIO',
      criadoEm: new Date('2026-01-01'),
      atualizadoEm: new Date('2026-01-01'),
    };
    prismaMock.usuario.findUnique.mockResolvedValue(usuario);

    const resultado = await service.buscarPorId('usuario-1');

    expect(resultado).toEqual(usuario);
    expect(prismaMock.usuario.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'usuario-1' } }),
    );
    // A senha nunca pode ser selecionada na busca
    const consulta = prismaMock.usuario.findUnique.mock.calls[0][0] as any;
    expect(consulta.select.senhaHash).toBeUndefined();
  });

  // TESTE 2: VIOLAÇÃO DE REGRA
  it('deve lançar NotFoundException ao buscar um usuário inexistente', async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(null);

    const operacao = service.buscarPorId('usuario-inexistente');

    await expect(operacao).rejects.toThrow(NotFoundException);
    await expect(operacao).rejects.toThrow('Usuário não encontrado');
  });

  // TESTE 3: CASO-LIMITE
  it('não deve alterar a senha ao atualizar um usuário sem enviar senha', async () => {
    prismaMock.usuario.update.mockResolvedValue({
      id: 'usuario-1',
      nome: 'Novo nome',
    });

    await service.atualizar('usuario-1', { nome: 'Novo nome' });

    const chamada = prismaMock.usuario.update.mock.calls[0][0] as any;
    expect(chamada.where).toEqual({ id: 'usuario-1' });
    expect(chamada.data.nome).toBe('Novo nome');
    expect(chamada.data).not.toHaveProperty('senhaHash');
  });
});