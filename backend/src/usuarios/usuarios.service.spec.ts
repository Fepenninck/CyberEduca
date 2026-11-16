import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
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

  it('deve lançar NotFoundException ao buscar um usuário inexistente', async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(null);

    const operacao = service.buscarPorId('usuario-inexistente');

    await expect(operacao).rejects.toThrow(NotFoundException);
    await expect(operacao).rejects.toThrow('Usuário não encontrado');
  });

  it('não deve alterar a senha ao atualizar um usuário sem enviar senha', async () => {
    prismaMock.usuario.findUnique.mockResolvedValue({
      email: 'thiago@cybereduca.test',
      senhaHash: 'hash-atual',
    });
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

  it('deve salvar o avatar escolhido e devolvê-lo no perfil', async () => {
    prismaMock.usuario.findUnique.mockResolvedValue({
      email: 'thiago@cybereduca.test',
      senhaHash: 'hash-atual',
    });
    prismaMock.usuario.update.mockResolvedValue({
      id: 'usuario-1',
      nome: 'Thiago',
      avatar: 'escudo',
    });

    const resultado = await service.atualizar('usuario-1', { avatar: 'escudo' });

    const chamada = prismaMock.usuario.update.mock.calls[0][0] as any;
    expect(chamada.data.avatar).toBe('escudo');
    expect(chamada.select.avatar).toBe(true);
    expect(resultado.avatar).toBe('escudo');
  });

  describe('alterações sensíveis', () => {
    const senhaAtual = 'SenhaAtual1!';
    let senhaHash: string;

    beforeEach(async () => {
      senhaHash = await bcrypt.hash(senhaAtual, 4);
      prismaMock.usuario.findUnique.mockResolvedValueOnce({
        email: 'thiago@cybereduca.test',
        senhaHash,
      });
    });

    it('exige a senha atual para trocar a senha', async () => {
      const operacao = service.atualizar('usuario-1', { senha: 'NovaSenha1!' });

      await expect(operacao).rejects.toThrow(BadRequestException);
      await expect(operacao).rejects.toThrow('Informe sua senha atual para alterar e-mail ou senha.');
      expect(prismaMock.usuario.update).not.toHaveBeenCalled();
    });

    it('recusa a troca quando a senha atual está incorreta', async () => {
      const operacao = service.atualizar('usuario-1', {
        senha: 'NovaSenha1!',
        senhaAtual: 'SenhaErrada1!',
      });

      await expect(operacao).rejects.toThrow('Senha atual incorreta.');
      expect(prismaMock.usuario.update).not.toHaveBeenCalled();
    });

    it('troca a senha com a senha atual correta e registra a data da troca', async () => {
      prismaMock.usuario.update.mockResolvedValue({ id: 'usuario-1' });

      await service.atualizar('usuario-1', { senha: 'NovaSenha1!', senhaAtual });

      const chamada = prismaMock.usuario.update.mock.calls[0][0] as any;
      expect(chamada.data.senhaHash).toEqual(expect.any(String));
      expect(chamada.data.senhaAlteradaEm).toBeInstanceOf(Date);
      expect(chamada.data).not.toHaveProperty('senhaAtual');
    });

    it('exige a senha atual para trocar o e-mail', async () => {
      const operacao = service.atualizar('usuario-1', { email: 'novo@cybereduca.test' });

      await expect(operacao).rejects.toThrow(BadRequestException);
      expect(prismaMock.usuario.update).not.toHaveBeenCalled();
    });

    it('lança ConflictException quando o e-mail pertence a outro usuário', async () => {
      prismaMock.usuario.findUnique.mockResolvedValueOnce({ id: 'usuario-2' });

      const operacao = service.atualizar('usuario-1', {
        email: 'outro@cybereduca.test',
        senhaAtual,
      });

      await expect(operacao).rejects.toThrow(ConflictException);
      expect(prismaMock.usuario.update).not.toHaveBeenCalled();
    });

    it('converte o erro P2002 do Prisma em ConflictException', async () => {
      prismaMock.usuario.findUnique.mockResolvedValueOnce(null);
      prismaMock.usuario.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'teste',
        }),
      );

      const operacao = service.atualizar('usuario-1', {
        email: 'novo@cybereduca.test',
        senhaAtual,
      });

      await expect(operacao).rejects.toThrow(ConflictException);
      await expect(operacao).rejects.toThrow('Este e-mail já está em uso.');
    });
  });

  it('permite que uma conta Google defina senha sem informar a senha atual', async () => {
    prismaMock.usuario.findUnique.mockResolvedValue({
      email: 'google@cybereduca.test',
      senhaHash: null,
    });
    prismaMock.usuario.update.mockResolvedValue({ id: 'usuario-1' });

    await service.atualizar('usuario-1', { senha: 'NovaSenha1!' });

    const chamada = prismaMock.usuario.update.mock.calls[0][0] as any;
    expect(chamada.data.senhaHash).toEqual(expect.any(String));
    expect(chamada.data.senhaAlteradaEm).toBeInstanceOf(Date);
  });

  it('lança NotFoundException ao atualizar um usuário inexistente', async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(null);

    await expect(service.atualizar('usuario-inexistente', { nome: 'Ana' })).rejects.toThrow(
      NotFoundException,
    );
    expect(prismaMock.usuario.update).not.toHaveBeenCalled();
  });
});
