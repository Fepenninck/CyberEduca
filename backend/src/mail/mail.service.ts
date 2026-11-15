import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

type Destinatario = { nome: string; email: string };

type MensagemComBotao = {
  destinatario: Destinatario;
  assunto: string;
  titulo: string;
  texto: string;
  botao: string;
  link: string;
  validade: string;
};

function escaparHtml(valor: string) {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  async enviarConfirmacaoLogin(destinatario: Destinatario, link: string) {
    await this.enviar({
      destinatario,
      assunto: 'Confirme seu acesso ao CyberEduca+',
      titulo: 'Confirme seu acesso',
      texto: 'Recebemos um pedido de login na sua conta. Para entrar, confirme que foi você.',
      botao: 'Confirmar acesso',
      link,
      validade: '5 minutos',
    });
  }

  async enviarRecuperacaoSenha(destinatario: Destinatario, link: string) {
    await this.enviar({
      destinatario,
      assunto: 'Redefina sua senha do CyberEduca+',
      titulo: 'Redefinição de senha',
      texto: 'Recebemos um pedido para redefinir a senha da sua conta.',
      botao: 'Definir nova senha',
      link,
      validade: '15 minutos',
    });
  }

  private obterTransporter() {
    if (this.transporter) return this.transporter;

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

    const porta = Number(SMTP_PORT || 465);
    this.transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: porta,
      secure: porta === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    return this.transporter;
  }

  private async enviar(mensagem: MensagemComBotao) {
    const transporter = this.obterTransporter();

    if (!transporter) {
      if (process.env.NODE_ENV === 'production') {
        throw new ServiceUnavailableException('O envio de e-mails não está configurado.');
      }
      this.logger.warn(
        `SMTP não configurado. Link para ${mensagem.destinatario.email}: ${mensagem.link}`,
      );
      return;
    }

    const nome = escaparHtml(mensagem.destinatario.nome);
    const link = escaparHtml(mensagem.link);

    try {
      await transporter.sendMail({
        from: process.env.MAIL_FROM || `CyberEduca+ <${process.env.SMTP_USER}>`,
        to: mensagem.destinatario.email,
        subject: mensagem.assunto,
        text: [
          `Olá, ${mensagem.destinatario.nome}!`,
          '',
          mensagem.texto,
          `${mensagem.botao}: ${mensagem.link}`,
          '',
          `O link vale por ${mensagem.validade} e só pode ser usado uma vez.`,
          'Se não foi você, ignore este e-mail.',
        ].join('\n'),
        html: `<div style="background:#080d18;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#e8eef6">
  <div style="max-width:480px;margin:0 auto;background:#162233;border-radius:8px;padding:32px">
    <h1 style="margin:0 0 16px;font-size:20px;color:#ffffff">${mensagem.titulo}</h1>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6">Olá, ${nome}!</p>
    <p style="margin:0 0 24px;font-size:14px;line-height:1.6">${mensagem.texto}</p>
    <a href="${link}" style="display:inline-block;background:#b2ff00;color:#080d18;font-weight:700;font-size:14px;text-decoration:none;padding:12px 24px;border-radius:4px">${mensagem.botao}</a>
    <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#91a1b7">O link vale por ${mensagem.validade} e só pode ser usado uma vez. Se não foi você, ignore este e-mail.</p>
  </div>
</div>`,
      });
    } catch (error) {
      this.logger.error(
        `Falha ao enviar e-mail para ${mensagem.destinatario.email}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new ServiceUnavailableException(
        'Não foi possível enviar o e-mail agora. Tente novamente em instantes.',
      );
    }
  }
}
