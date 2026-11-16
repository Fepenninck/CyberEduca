import { jest } from '@jest/globals';
import { BadRequestException, HttpException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { AuditoriaService } from '../auditoria.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma.service';
import { AuthService } from './auth.service';
import { hashToken } from './token-uso-unico';

type MockAsync = jest.Mock<(...args: any[]) => Promise<any>>;

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    usuario: {
      findUnique: MockAsync;
      create: MockAsync;
      update: MockAsync;
      updateMany: MockAsync;
    };
  };
  let jwtService: { sign: jest.Mock<(payload: { sub: string; email: string }) => string> };
  let auditoria: { registrar: MockAsync };
  let mail: { enviarConfirmacaoLogin: MockAsync; enviarRecuperacaoSenha: MockAsync };

  beforeEach(async () => {
    prisma = {
      usuario: {
        findUnique: jest.fn<(...args: any[]) => Promise<any>>(),
        create: jest.fn<(...args: any[]) => Promise<any>>(),
        update: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue({}),
        updateMany: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue({ count: 1 }),
      },
    };
    jwtService = {
      sign: jest
        .fn<(payload: { sub: string; email: string }) => string>()
        .mockReturnValue('jwt-de-teste'),
    };
    auditoria = {
      registrar: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(undefined),
    };
    mail = {
      enviarConfirmacaoLogin: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(undefined),
      enviarRecuperacaoSenha: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: AuditoriaService, useValue: auditoria },
        { provide: MailService, useValue: mail },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  function tokenDoLink(chamada: unknown[]) {
    const link = new URL(chamada[1] as string);
    return link.searchParams.get('token') as string;
  }

  describe('login com confirmação por e-mail', () => {
    it('valida a senha, grava o hash do link e envia o e-mail sem abrir sessão', async () => {
      const senhaHash = await bcrypt.hash('Senha123!', 4);
      prisma.usuario.findUnique.mockResolvedValue({
        id: 'usuario-1',
        nome: 'Aluno',
        email: 'aluno@exemplo.com',
        senhaHash,
        tokenLoginExpiraEm: null,
      });

      await expect(
        service.login({ email: 'aluno@exemplo.com', password: 'Senha123!' }, { ip: '127.0.0.1' }),
      ).resolves.toEqual({
        message: 'Enviamos um link de confirmação para o seu e-mail. Ele vale por 5 minutos.',
        confirmacaoPendente: true,
      });

      expect(jwtService.sign).not.toHaveBeenCalled();
      expect(mail.enviarConfirmacaoLogin).toHaveBeenCalledWith(
        { nome: 'Aluno', email: 'aluno@exemplo.com' },
        expect.stringContaining('/login/confirmar?token='),
      );

      const token = tokenDoLink(mail.enviarConfirmacaoLogin.mock.calls[0]);
      const gravacao = prisma.usuario.update.mock.calls[0][0] as any;
      expect(gravacao.data.tokenLoginHash).toBe(hashToken(token));
      expect(gravacao.data.tokenLoginHash).not.toBe(token);

      const validade = gravacao.data.tokenLoginExpiraEm.getTime() - Date.now();
      expect(validade).toBeGreaterThan(4 * 60 * 1000);
      expect(validade).toBeLessThanOrEqual(5 * 60 * 1000);
    });

    it('apaga o link gravado quando o e-mail não pode ser enviado', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 'usuario-1',
        nome: 'Aluno',
        email: 'aluno@exemplo.com',
        senhaHash: await bcrypt.hash('Senha123!', 4),
        tokenLoginExpiraEm: null,
      });
      mail.enviarConfirmacaoLogin.mockRejectedValue(new Error('SMTP fora do ar'));

      await expect(
        service.login({ email: 'aluno@exemplo.com', password: 'Senha123!' }, {}),
      ).rejects.toThrow('SMTP fora do ar');

      expect(prisma.usuario.update).toHaveBeenLastCalledWith({
        where: { id: 'usuario-1' },
        data: { tokenLoginHash: null, tokenLoginExpiraEm: null },
      });
    });

    it('não envia outro e-mail antes de 30 segundos', async () => {
      const senhaHash = await bcrypt.hash('Senha123!', 4);
      prisma.usuario.findUnique.mockResolvedValue({
        id: 'usuario-1',
        nome: 'Aluno',
        email: 'aluno@exemplo.com',
        senhaHash,
        tokenLoginExpiraEm: new Date(Date.now() + 5 * 60 * 1000 - 5000),
      });

      const operacao = service.login({ email: 'aluno@exemplo.com', password: 'Senha123!' }, {});

      await expect(operacao).rejects.toThrow(HttpException);
      expect(mail.enviarConfirmacaoLogin).not.toHaveBeenCalled();
    });

    it('rejeita senha incorreta sem enviar e-mail', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 'usuario-1',
        nome: 'Aluno',
        email: 'aluno@exemplo.com',
        senhaHash: await bcrypt.hash('Senha123!', 4),
      });

      await expect(
        service.login({ email: 'aluno@exemplo.com', password: 'Errada123!' }, {}),
      ).rejects.toThrow(UnauthorizedException);
      expect(mail.enviarConfirmacaoLogin).not.toHaveBeenCalled();
    });

    it('rejeita login de conta Google sem senha cadastrada', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 'google-1',
        email: 'google@exemplo.com',
        senhaHash: null,
      });

      await expect(
        service.login({ email: 'google@exemplo.com', password: 'qualquer' }, {}),
      ).rejects.toThrow(UnauthorizedException);

      expect(jwtService.sign).not.toHaveBeenCalled();
      expect(mail.enviarConfirmacaoLogin).not.toHaveBeenCalled();
    });

    it('confirma o link uma única vez e assina o token de sessão', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 'usuario-1',
        email: 'aluno@exemplo.com',
        papel: 'USUARIO',
      });

      await expect(service.confirmarLogin('token-recebido', {})).resolves.toEqual({
        message: 'Login realizado com sucesso!',
        access_token: 'jwt-de-teste',
        papel: 'USUARIO',
      });

      expect(prisma.usuario.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tokenLoginHash: hashToken('token-recebido') } }),
      );
      const consumo = prisma.usuario.updateMany.mock.calls[0][0] as any;
      expect(consumo.where.tokenLoginExpiraEm.gt).toBeInstanceOf(Date);
      expect(consumo.data).toEqual({ tokenLoginHash: null, tokenLoginExpiraEm: null });
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: 'usuario-1', email: 'aluno@exemplo.com' });
    });

    it('recusa link expirado ou já usado', async () => {
      prisma.usuario.findUnique.mockResolvedValue({ id: 'usuario-1', email: 'a@b.com', papel: 'USUARIO' });
      prisma.usuario.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.confirmarLogin('token-velho', {})).rejects.toThrow(BadRequestException);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('recusa link desconhecido', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      await expect(service.confirmarLogin('token-inexistente', {})).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.usuario.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('cadastro', () => {
    it('rejeita cadastro quando o e-mail já existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue({ id: 'usuario-existente' });

      await expect(
        service.register({ name: 'Aluno', email: 'aluno@exemplo.com', password: 'Senha123!' }, {}),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.usuario.create).not.toHaveBeenCalled();
      expect(auditoria.registrar).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('converte e-mail duplicado detectado pelo banco em BadRequestException', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);
      prisma.usuario.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'teste',
        }),
      );

      await expect(
        service.register({ name: 'Aluno', email: 'aluno@exemplo.com', password: 'Senha123!' }, {}),
      ).rejects.toThrow('Este e-mail já está em uso.');
      expect(auditoria.registrar).not.toHaveBeenCalled();
    });
  });

  describe('recuperação de senha', () => {
    const mensagemGenerica =
      'Se houver uma conta com este e-mail, enviaremos um link para redefinir a senha.';

    it('responde a mesma mensagem quando o e-mail não existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      await expect(service.solicitarRecuperacaoSenha('ninguem@exemplo.com')).resolves.toEqual({
        message: mensagemGenerica,
      });
      expect(mail.enviarRecuperacaoSenha).not.toHaveBeenCalled();
    });

    it('envia o link de recuperação válido por 15 minutos', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 'usuario-1',
        nome: 'Aluno',
        email: 'aluno@exemplo.com',
        tokenRecuperacaoExpiraEm: null,
      });

      await expect(service.solicitarRecuperacaoSenha('aluno@exemplo.com')).resolves.toEqual({
        message: mensagemGenerica,
      });

      const token = tokenDoLink(mail.enviarRecuperacaoSenha.mock.calls[0]);
      expect(mail.enviarRecuperacaoSenha.mock.calls[0][1]).toContain('/redefinir-senha?token=');
      const gravacao = prisma.usuario.update.mock.calls[0][0] as any;
      expect(gravacao.data.tokenRecuperacaoHash).toBe(hashToken(token));
      const validade = gravacao.data.tokenRecuperacaoExpiraEm.getTime() - Date.now();
      expect(validade).toBeGreaterThan(14 * 60 * 1000);
      expect(validade).toBeLessThanOrEqual(15 * 60 * 1000);
    });

    it('redefine a senha, invalida sessões e consome o link', async () => {
      prisma.usuario.findUnique.mockResolvedValue({ id: 'usuario-1' });

      await expect(service.redefinirSenha('token-recuperacao', 'NovaSenha1!', {})).resolves.toEqual({
        message: 'Senha redefinida com sucesso. Entre com a nova senha.',
      });

      const chamada = prisma.usuario.updateMany.mock.calls[0][0] as any;
      expect(chamada.where.tokenRecuperacaoHash).toBe(hashToken('token-recuperacao'));
      expect(chamada.where.tokenRecuperacaoExpiraEm.gt).toBeInstanceOf(Date);
      expect(chamada.data.senhaAlteradaEm).toBeInstanceOf(Date);
      expect(chamada.data.tokenRecuperacaoHash).toBeNull();
      expect(await bcrypt.compare('NovaSenha1!', chamada.data.senhaHash)).toBe(true);
    });

    it('recusa link de recuperação expirado ou já usado', async () => {
      prisma.usuario.findUnique.mockResolvedValue({ id: 'usuario-1' });
      prisma.usuario.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.redefinirSenha('token-velho', 'NovaSenha1!', {})).rejects.toThrow(
        'Este link de recuperação expirou ou já foi usado. Peça um novo link.',
      );
      expect(auditoria.registrar).not.toHaveBeenCalled();
    });
  });
});
