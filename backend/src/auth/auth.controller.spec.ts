import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AuthController } from './auth.controller';

const criarRequest = (extra: Record<string, unknown> = {}) => ({
  ip: '127.0.0.1',
  get: jest.fn().mockReturnValue('jest-agent'),
  ...extra,
});

describe('AuthController', () => {
  const authService = {
    register: jest.fn<(...args: any[]) => Promise<any>>(),
    login: jest.fn<(...args: any[]) => Promise<any>>(),
    confirmarLogin: jest.fn<(...args: any[]) => Promise<any>>(),
    solicitarRecuperacaoSenha: jest.fn<(...args: any[]) => Promise<any>>(),
    redefinirSenha: jest.fn<(...args: any[]) => Promise<any>>(),
  };
  const jwtService = { sign: jest.fn().mockReturnValue('token-google') };
  const auditoria = { registrar: jest.fn<(...args: any[]) => Promise<void>>() };
  let controller: AuthController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuthController(authService as any, jwtService as any, auditoria as any);
  });

  it('cadastra o usuário repassando IP e navegador', async () => {
    authService.register.mockResolvedValue({ message: 'Cadastro realizado.' });
    const dto = { nome: 'Ana', email: 'ana@teste.com', senha: 'SenhaForte1!' } as any;

    await expect(controller.register(dto, criarRequest() as any)).resolves.toEqual({ message: 'Cadastro realizado.' });
    expect(authService.register).toHaveBeenCalledWith(dto, { ip: '127.0.0.1', userAgent: 'jest-agent' });
  });

  it('faz login enviando a confirmação por e-mail, sem abrir sessão', async () => {
    const pendente = { message: 'Enviamos um link de confirmação.', confirmacaoPendente: true };
    authService.login.mockResolvedValue(pendente);
    const dto = { email: 'ana@teste.com', password: 'x' } as any;

    await expect(controller.login(dto, criarRequest() as any)).resolves.toEqual(pendente);
    expect(authService.login).toHaveBeenCalledWith(dto, { ip: '127.0.0.1', userAgent: 'jest-agent' });
  });

  it('confirma o login gravando o token em cookie HttpOnly e sem devolvê-lo no corpo', async () => {
    authService.confirmarLogin.mockResolvedValue({ message: 'Login realizado.', access_token: 'jwt-123', papel: 'USUARIO' });
    const response = { cookie: jest.fn() };

    await expect(controller.confirmarLogin({ token: 'abc' }, criarRequest() as any, response as any))
      .resolves.toEqual({ message: 'Login realizado.', papel: 'USUARIO' });
    expect(response.cookie).toHaveBeenCalledWith('cybereduca_session', 'jwt-123', expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' }));
  });

  it('usa cookie seguro em produção', async () => {
    const ambiente = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    authService.confirmarLogin.mockResolvedValue({ message: 'ok', access_token: 'jwt', papel: 'USUARIO' });
    const response = { cookie: jest.fn() };

    await controller.confirmarLogin({ token: 'abc' }, criarRequest() as any, response as any);
    expect(response.cookie).toHaveBeenCalledWith('cybereduca_session', 'jwt', expect.objectContaining({ secure: true }));
    process.env.NODE_ENV = ambiente;
  });

  it('pede a recuperação de senha e redefine a senha limpando o cookie', async () => {
    authService.solicitarRecuperacaoSenha.mockResolvedValue({ message: 'Se houver uma conta...' });
    authService.redefinirSenha.mockResolvedValue({ message: 'Senha redefinida.' });
    const response = { clearCookie: jest.fn() };

    await expect(controller.esqueciSenha({ email: 'ana@teste.com' })).resolves.toEqual({ message: 'Se houver uma conta...' });
    expect(authService.solicitarRecuperacaoSenha).toHaveBeenCalledWith('ana@teste.com');

    await expect(controller.redefinirSenha({ token: 't', senha: 'NovaSenha1!' }, criarRequest() as any, response as any))
      .resolves.toEqual({ message: 'Senha redefinida.' });
    expect(authService.redefinirSenha).toHaveBeenCalledWith('t', 'NovaSenha1!', { ip: '127.0.0.1', userAgent: 'jest-agent' });
    expect(response.clearCookie).toHaveBeenCalledWith('cybereduca_session', expect.objectContaining({ httpOnly: true }));
  });

  it('encerra a sessão, registra auditoria e limpa o cookie', async () => {
    const response = { clearCookie: jest.fn() };

    await expect(controller.logout(criarRequest({ user: { id: 'u1' } }) as any, response as any))
      .resolves.toEqual({ message: 'Sessão encerrada com sucesso.' });
    expect(auditoria.registrar).toHaveBeenCalledWith(expect.objectContaining({ acao: 'LOGOUT', entidadeId: 'u1', sucesso: true }));
    expect(response.clearCookie).toHaveBeenCalledWith('cybereduca_session', expect.objectContaining({ httpOnly: true }));
  });

  it('conclui o login com Google, grava a sessão e redireciona ao painel', async () => {
    process.env.FRONTEND_URL = 'http://localhost:3001';
    const response = { cookie: jest.fn(), redirect: jest.fn() };

    await expect(controller.google()).resolves.toBeUndefined();
    await controller.googleCallback(criarRequest({ user: { id: 'u1', email: 'ana@teste.com' } }) as any, response as any);

    expect(jwtService.sign).toHaveBeenCalledWith({ sub: 'u1', email: 'ana@teste.com' });
    expect(response.cookie).toHaveBeenCalledWith('cybereduca_session', 'token-google', expect.any(Object));
    expect(auditoria.registrar).toHaveBeenCalledWith(expect.objectContaining({ acao: 'LOGIN', detalhes: { metodo: 'GOOGLE' } }));
    expect(response.redirect).toHaveBeenCalledWith('http://localhost:3001/dashboard');
  });
});
