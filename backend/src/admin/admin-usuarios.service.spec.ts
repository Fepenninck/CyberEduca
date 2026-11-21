import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AdminUsuariosService } from './admin-usuarios.service';

describe('AdminUsuariosService', () => {
  const prismaMock = {
    $transaction: jest.fn<(...args: any[]) => Promise<any>>(),
    logAuditoria: { deleteMany: jest.fn<(...args: any[]) => Promise<any>>() },
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
    prismaMock.$transaction.mockImplementation((work: any) => work(prismaMock));
    service = new AdminUsuariosService(prismaMock as unknown as PrismaService);
  });

  it('lista usuários sem selecionar campos de senha', async () => {
    const usuarios = [{ id: 'u1', nome: 'Ana', email: 'ana@test.dev' }];
    prismaMock.usuario.findMany.mockResolvedValue(usuarios);

    await expect(service.listarUsuarios()).resolves.toEqual([{ ...usuarios[0], email: 'an***@test.dev' }]);
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

    prismaMock.usuario.findUnique.mockResolvedValue({ email: 'ana@test.dev' });
    await expect(service.excluirUsuario('u1')).resolves.toEqual({ id: 'u1' });
    expect(prismaMock.logAuditoria.deleteMany).toHaveBeenCalled();
    expect(prismaMock.usuario.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u1' } }),
    );
  });

  it('normaliza o e-mail e recusa um e-mail que pertence a outro usuário', async () => {
    prismaMock.usuario.findUnique.mockResolvedValue({ id: 'u2' });

    await expect(service.atualizarUsuario('u1', { email: ' Ana@Test.dev ' })).rejects.toThrow(
      ConflictException,
    );
    expect(prismaMock.usuario.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'ana@test.dev' } }),
    );
    expect(prismaMock.usuario.update).not.toHaveBeenCalled();
  });

  it('nao encaminha campos extras para o banco mesmo em chamadas internas', async () => {
    prismaMock.usuario.update.mockResolvedValue({ id: 'u1' });
    await service.atualizarUsuario('u1', { nome: 'Ana', papel: 'ADMIN', senhaHash: 'segredo' } as any);
    expect(prismaMock.usuario.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { nome: 'Ana', email: undefined },
    }));
  });
});
