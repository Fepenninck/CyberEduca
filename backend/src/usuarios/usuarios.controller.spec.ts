import { describe, expect, it, jest } from '@jest/globals';
import { JwtService } from '@nestjs/jwt';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';

function criarController(atualizado: { id: string; nome?: string; email: string }) {
  const service = { atualizar: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(atualizado) };
  const jwtService = { sign: jest.fn().mockReturnValue('novo-token') };
  const response = { cookie: jest.fn() };
  const controller = new UsuariosController(
    service as unknown as UsuariosService,
    jwtService as unknown as JwtService,
  );

  return { controller, service, jwtService, response };
}

describe('UsuariosController', () => {
  const request = { user: { id: 'u1', nome: 'Ana', email: 'ana@test.dev' } };

  it('retorna o perfil autenticado e encaminha atualização de perfil', async () => {
    const { controller, service, jwtService, response } = criarController({
      id: 'u1',
      nome: 'Ana',
      email: 'ana@test.dev',
    });

    expect(controller.meuPerfil(request)).toEqual(request.user);
    await expect(
      controller.atualizarMeuPerfil(request, { nome: 'Ana' } as any, response as any),
    ).resolves.toEqual({ id: 'u1', nome: 'Ana', email: 'ana@test.dev' });
    expect(service.atualizar).toHaveBeenCalledWith('u1', { nome: 'Ana' });
    expect(jwtService.sign).not.toHaveBeenCalled();
    expect(response.cookie).not.toHaveBeenCalled();
  });

  it('renova o cookie de sessão depois de trocar a senha', async () => {
    const { controller, jwtService, response } = criarController({ id: 'u1', email: 'ana@test.dev' });

    await controller.atualizarMeuPerfil(
      request,
      { senha: 'NovaSenha1!', senhaAtual: 'SenhaAtual1!' } as any,
      response as any,
    );

    expect(jwtService.sign).toHaveBeenCalledWith({ sub: 'u1', email: 'ana@test.dev' });
    expect(response.cookie).toHaveBeenCalledWith(
      'cybereduca_session',
      'novo-token',
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('renova o cookie de sessão depois de trocar o e-mail', async () => {
    const { controller, jwtService, response } = criarController({ id: 'u1', email: 'nova@test.dev' });

    await controller.atualizarMeuPerfil(
      request,
      { email: 'nova@test.dev', senhaAtual: 'SenhaAtual1!' } as any,
      response as any,
    );

    expect(jwtService.sign).toHaveBeenCalledWith({ sub: 'u1', email: 'nova@test.dev' });
    expect(response.cookie).toHaveBeenCalled();
  });

  it('encaminha o pedido de desempenho do aluno logado', () => {
    const service = { desempenho: jest.fn().mockReturnValue({ ritmo: {} }) };
    const controller = new UsuariosController(
      service as unknown as UsuariosService,
      {} as JwtService,
    );

    expect(controller.meuDesempenho({ user: { id: 'u1' } })).toEqual({ ritmo: {} });
    expect(service.desempenho).toHaveBeenCalledWith('u1');
  });
});
