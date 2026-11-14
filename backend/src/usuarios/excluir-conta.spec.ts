import { describe, expect, it, jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { validate } from 'class-validator';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { PrismaService } from '../prisma.service';
import type { Response } from 'express';

const asyncMock = (value: unknown = undefined) => jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(value);
function setup() {
  const tx = { usuario: { findUnique: asyncMock({ email: 'ana@example.com' }), delete: asyncMock() }, logAuditoria: { deleteMany: asyncMock() } };
  const transaction = jest.fn<(...args: any[]) => Promise<any>>().mockImplementation(work => work(tx));
  return { tx, transaction, service: new UsuariosService({ $transaction: transaction } as unknown as PrismaService) };
}
describe('Exclusão da própria conta', () => {
  it.each(['', 'EXCLUIR', 'excluir ', 'confirmar'])('recusa a confirmação %j antes de acessar o banco', async confirmation => {
    const { service, transaction } = setup();
    await expect(service.excluirConta('aluno', confirmation)).rejects.toBeInstanceOf(BadRequestException);
    expect(transaction).not.toHaveBeenCalled();
  });
  it('valida o texto também na entrada HTTP', async () => {
    expect(await validate(Object.assign(new DeleteAccountDto(), { confirmacao: 'excluir' }))).toHaveLength(0);
    expect((await validate(new DeleteAccountDto())).length).toBeGreaterThan(0);
  });
  it('apaga somente a conta autenticada e limpa os registros vinculados em uma transação', async () => {
    const { service, tx, transaction } = setup();
    await service.excluirConta('aluno', 'excluir');
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(tx.usuario.findUnique).toHaveBeenCalledWith({ where: { id: 'aluno' }, select: { email: true } });
    expect(tx.usuario.delete).toHaveBeenCalledWith({ where: { id: 'aluno' } });
    expect(tx.logAuditoria.deleteMany).toHaveBeenCalledWith({ where: { OR: [
      { atorId: 'aluno' }, { entidadeId: 'aluno' },
      { entidade: 'Usuario', acao: 'LOGIN_FALHOU', detalhes: { path: ['emailInformado'], equals: 'ana@example.com' } },
    ] } });
  });
  it('não tenta excluir uma conta inexistente', async () => {
    const { service, tx } = setup(); tx.usuario.findUnique.mockResolvedValue(null);
    await expect(service.excluirConta('ausente', 'excluir')).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.logAuditoria.deleteMany).not.toHaveBeenCalled();
    expect(tx.usuario.delete).not.toHaveBeenCalled();
  });
  it('usa o usuário da sessão e encerra o cookie somente após sucesso', async () => {
    const excluirConta = asyncMock({ message: 'Excluída' });
    const controller = new UsuariosController({ excluirConta } as unknown as UsuariosService);
    const clearCookie = jest.fn();
    await controller.excluirMinhaConta({ user: { id: 'autenticado' } }, { confirmacao: 'excluir' }, { clearCookie } as unknown as Response);
    expect(excluirConta).toHaveBeenCalledWith('autenticado', 'excluir');
    expect(clearCookie).toHaveBeenCalledWith('cybereduca_session', expect.objectContaining({ path: '/', httpOnly: true }));
  });
  it('preserva a sessão quando a transação falha', async () => {
    const excluirConta = asyncMock(); excluirConta.mockRejectedValue(new Error('Falha no banco'));
    const controller = new UsuariosController({ excluirConta } as unknown as UsuariosService);
    const clearCookie = jest.fn();
    await expect(controller.excluirMinhaConta({ user: { id: 'aluno' } }, { confirmacao: 'excluir' }, { clearCookie } as unknown as Response)).rejects.toThrow('Falha no banco');
    expect(clearCookie).not.toHaveBeenCalled();
  });
  it('exige autenticação na rota de exclusão', () => {
    expect(Reflect.getMetadata('__guards__', UsuariosController.prototype.excluirMinhaConta)).toEqual([JwtAuthGuard]);
  });
});
