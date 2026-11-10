import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AdminUsuariosService } from './admin-usuarios.service';

describe('AdminUsuariosService', () => {
  const prismaMock = {
    usuario: {
      findMany: jest.fn<(...args: any[]) => Promise<any>>(),
      findUnique: jest.fn<(...args: any[]) => Promise<any>>(),
      update: jest.fn<(...args: any[]) => Promise<any>>(),
      delete: jest.fn<(...args: any[]) => Promise<any>>(),
    },
  };
  let service: AdminUsuariosService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new AdminUsuariosService(prismaMock as unknown as PrismaService);
  });

  it('lista usuários sem selecionar campos de senha', async () => {
    const usuarios = [{ id: 'u1', nome: 'Ana', email: 'ana@test.dev' }];
    prismaMock.usuario.findMany.mockResolvedValue(usuarios);

    await expect(service.listarUsuarios()).resolves.toEqual(usuarios);
    expect(prismaMock.usuario.findMany).toHaveBeenCalled();
    const consulta = prismaMock.usuario.findMany.mock.calls[0][0] as any;
    expect(consulta.select.senhaHash).toBeUndefined();
  });

  it('busca um usuário pelo identificador', async () => {
    const usuario = { id: 'u1', nome: 'Ana', email: 'ana@test.dev' };
    prismaMock.usuario.findUnique.mockResolvedValue(usuario);

    await expect(service.buscarUsuario('u1')).resolves.toEqual(usuario);
    expect(prismaMock.usuario.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u1' } }),
    );
  });

  it('lança NotFoundException quando o usuário não existe', async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(null);

    await expect(service.buscarUsuario('inexistente')).rejects.toThrow(NotFoundException);
  });

  it('atualiza e exclui usuário pelo identificador informado', async () => {
    prismaMock.usuario.update.mockResolvedValue({ id: 'u1', nome: 'Ana Silva' });
    prismaMock.usuario.delete.mockResolvedValue({ id: 'u1', nome: 'Ana Silva' });

    await expect(service.atualizarUsuario('u1', { nome: 'Ana Silva' })).resolves.toEqual({
      id: 'u1', nome: 'Ana Silva',
    });
    expect(prismaMock.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u1' }, data: { nome: 'Ana Silva' } }),
    );

    await expect(service.excluirUsuario('u1')).resolves.toEqual({
      id: 'u1', nome: 'Ana Silva',
    });
    expect(prismaMock.usuario.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u1' } }),
    );
  });
});
