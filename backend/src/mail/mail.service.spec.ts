import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { MailService } from './mail.service';

describe('MailService', () => {
  const ambienteOriginal = { ...process.env };

  afterEach(() => {
    process.env = { ...ambienteOriginal };
    jest.restoreAllMocks();
  });

  function semSmtp() {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.BREVO_API_KEY;
  }

  it('mostra o link no log quando o SMTP não está configurado fora de produção', async () => {
    semSmtp();
    process.env.NODE_ENV = 'test';
    const aviso = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    await new MailService().enviarConfirmacaoLogin(
      { nome: 'Ana', email: 'ana@test.dev' },
      'http://localhost:3001/login/confirmar?token=abc',
    );

    expect(aviso).toHaveBeenCalledWith(expect.stringContaining('/login/confirmar?token=abc'));
  });

  it('envia o e-mail com o link e escapa o nome do destinatário', async () => {
    process.env.SMTP_HOST = 'smtp.teste';
    process.env.SMTP_USER = 'remetente@test.dev';
    process.env.SMTP_PASS = 'senha';
    const service = new MailService();
    const sendMail = jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue({});
    (service as any).transporter = { sendMail };

    await service.enviarConfirmacaoLogin(
      { nome: '<b>Ana</b>', email: 'ana@test.dev' },
      'http://localhost:3001/login/confirmar?token=abc',
    );

    const mensagem = sendMail.mock.calls[0][0] as any;
    expect(mensagem.to).toBe('ana@test.dev');
    expect(mensagem.html).toContain('&lt;b&gt;Ana&lt;/b&gt;');
    expect(mensagem.html).toContain('href="http://localhost:3001/login/confirmar?token=abc"');
  });

  it('troca a falha do SMTP por uma mensagem amigável', async () => {
    process.env.SMTP_HOST = 'smtp.teste';
    process.env.SMTP_USER = 'remetente@test.dev';
    process.env.SMTP_PASS = 'senha';
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const service = new MailService();
    (service as any).transporter = {
      sendMail: jest.fn<(...args: any[]) => Promise<any>>().mockRejectedValue(new Error('535 Invalid login')),
    };

    await expect(
      service.enviarRecuperacaoSenha({ nome: 'Ana', email: 'ana@test.dev' }, 'http://x'),
    ).rejects.toThrow('Não foi possível enviar o e-mail agora. Tente novamente em instantes.');
  });

  it('envia pela API da Brevo quando a chave está configurada', async () => {
    semSmtp();
    process.env.BREVO_API_KEY = 'chave-de-teste';
    process.env.MAIL_FROM = 'CyberEduca+ <remetente@test.dev>';
    const chamada = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{"messageId":"1"}', { status: 201 }));

    await new MailService().enviarRecuperacaoSenha(
      { nome: 'Ana', email: 'ana@test.dev' },
      'http://localhost:3001/redefinir-senha?token=abc',
    );

    const [url, opcoes] = chamada.mock.calls[0] as [string, RequestInit];
    const corpo = JSON.parse(opcoes.body as string);
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect((opcoes.headers as Record<string, string>)['api-key']).toBe('chave-de-teste');
    expect(corpo.sender).toEqual({ name: 'CyberEduca+', email: 'remetente@test.dev' });
    expect(corpo.to).toEqual([{ email: 'ana@test.dev', name: 'Ana' }]);
    expect(corpo.htmlContent).toContain('/redefinir-senha?token=abc');
  });

  it('troca a recusa da Brevo por uma mensagem amigável', async () => {
    semSmtp();
    process.env.BREVO_API_KEY = 'chave-invalida';
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{"message":"Key not found"}', { status: 401 }));

    await expect(
      new MailService().enviarConfirmacaoLogin({ nome: 'Ana', email: 'ana@test.dev' }, 'http://x'),
    ).rejects.toThrow('Não foi possível enviar o e-mail agora. Tente novamente em instantes.');
  });

  it('falha em produção quando o SMTP não está configurado', async () => {
    semSmtp();
    process.env.NODE_ENV = 'production';

    await expect(
      new MailService().enviarRecuperacaoSenha({ nome: 'Ana', email: 'ana@test.dev' }, 'http://x'),
    ).rejects.toThrow(ServiceUnavailableException);
  });
});
