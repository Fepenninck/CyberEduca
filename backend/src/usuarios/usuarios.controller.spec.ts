import { describe, expect, it, jest } from '@jest/globals';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';

describe('UsuariosController', () => {
  it('retorna o perfil autenticado e encaminha atualização de perfil', () => {
    const service = { atualizar: jest.fn().mockReturnValue({ id: 'u1', nome: 'Ana' }) };
    const controller = new UsuariosController(service as unknown as UsuariosService);
    const request = { user: { id: 'u1', nome: 'Ana' } };

    expect(controller.meuPerfil(request)).toEqual(request.user);
    expect(controller.atualizarMeuPerfil(request, { nome: 'Ana' } as any)).toEqual({ id: 'u1', nome: 'Ana' });
    expect(service.atualizar).toHaveBeenCalledWith('u1', { nome: 'Bia' });
  });

  it('encaminha o pedido de desempenho do aluno logado', () => {
    const service = { desempenho: jest.fn().mockReturnValue({ comparativo: {} }) };
    const controller = new UsuariosController(service as unknown as UsuariosService);

    expect(controller.meuDesempenho({ user: { id: 'u1' } })).toEqual({ comparativo: {} });
    expect(service.desempenho).toHaveBeenCalledWith('u1');
  });
});
