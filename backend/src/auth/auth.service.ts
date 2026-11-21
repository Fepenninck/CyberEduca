import { TERMOS_VERSAO } from './termos';
import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AcaoAuditoria, Prisma } from '@prisma/client';
import { AuditoriaService } from '../auditoria.service';
import { MailService } from '../mail/mail.service';
import {
  gerarTokenUsoUnico,
  hashToken,
  reenvioMuitoRapido,
  VALIDADE_LINK_LOGIN_MS,
  VALIDADE_LINK_RECUPERACAO_MS,
} from './token-uso-unico';

const LINK_LOGIN_INVALIDO = 'Este link de acesso expirou ou já foi usado. Entre novamente para receber outro.';
const LINK_RECUPERACAO_INVALIDO = 'Este link de recuperação expirou ou já foi usado. Peça um novo link.';

function urlDoFrontend() {
  return (process.env.FRONTEND_URL || 'http://localhost:3001').replace(/\/+$/, '');
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private readonly auditoria: AuditoriaService,
    private readonly mail: MailService,
  ) {}

  async register(
    dto: RegisterDto,
    contexto: {
      ip?: string;
      userAgent?: string;
    },
  ) {
    if (dto.acceptedTerms !== true || dto.termsVersion !== TERMOS_VERSAO) {
      throw new BadRequestException('Aceite a versao atual dos Termos de Uso.');
    }
    const nome = dto.name?.trim();
    if (!nome || nome.length < 2 || nome.length > 100) throw new BadRequestException('Informe um nome entre 2 e 100 caracteres.');
    const userExists = await this.prisma.usuario.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (userExists) {
      throw new BadRequestException('Este e-mail já está em uso.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.usuario
      .create({
        data: {
          nome,
          termosVersao: TERMOS_VERSAO,
          termosAceitosEm: new Date(),
          email: dto.email,
          senhaHash: hashedPassword,
        },
      })
      .catch((error: unknown) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new BadRequestException('Este e-mail já está em uso.');
        }
        throw error;
      });

    await this.auditoria.registrar({
      acao: AcaoAuditoria.CADASTRO,
      entidade: 'Usuario',
      entidadeId: user.id,
      atorId: user.id,
      detalhes: {
        metodo: 'SENHA',
      },
      ip: contexto.ip,
      userAgent: contexto.userAgent,
      sucesso: true,
    });

    return {
      message: 'Usuário cadastrado com sucesso!',
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
      },
    };
  }

  async aceitarTermos(usuarioId: string, dto: { acceptedTerms: boolean; termsVersion: string }) {
    if (dto.acceptedTerms !== true || dto.termsVersion !== TERMOS_VERSAO) throw new BadRequestException('Aceite a versao atual dos Termos de Uso.');
    return this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { termosVersao: TERMOS_VERSAO, termosAceitosEm: new Date() },
      select: { id: true, email: true, papel: true },
    });
  }

  async login(
    dto: LoginDto,
    contexto: {
      ip?: string;
      userAgent?: string;
    },
  ) {
    const user = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      await this.auditoria.registrar({
        acao: AcaoAuditoria.LOGIN_FALHOU,
        entidade: 'Usuario',
        detalhes: {
          emailInformado: dto.email,
          motivo: 'USUARIO_NAO_ENCONTRADO',
        },
        ip: contexto.ip,
        userAgent: contexto.userAgent,
        sucesso: false,
      });
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (!user.senhaHash) {
      await this.auditoria.registrar({
        acao: AcaoAuditoria.LOGIN_FALHOU,
        entidade: 'Usuario',
        entidadeId: user.id,
        atorId: user.id,
        detalhes: {
          motivo: 'CONTA_GOOGLE',
        },
        ip: contexto.ip,
        userAgent: contexto.userAgent,
        sucesso: false,
      });
      throw new UnauthorizedException('Esta conta usa login com Google.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.senhaHash);

    if (!isPasswordValid) {
      await this.auditoria.registrar({
        acao: AcaoAuditoria.LOGIN_FALHOU,
        entidade: 'Usuario',
        entidadeId: user.id,
        atorId: user.id,
        detalhes: {
          motivo: 'SENHA_INCORRETA',
        },
        ip: contexto.ip,
        userAgent: contexto.userAgent,
        sucesso: false,
      });
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (reenvioMuitoRapido(user.tokenLoginExpiraEm, VALIDADE_LINK_LOGIN_MS)) {
      throw new HttpException(
        'Aguarde alguns segundos antes de pedir outro e-mail de confirmação.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const { token, hash } = gerarTokenUsoUnico();

    await this.prisma.usuario.update({
      where: { id: user.id },
      data: {
        tokenLoginHash: hash,
        tokenLoginExpiraEm: new Date(Date.now() + VALIDADE_LINK_LOGIN_MS),
      },
    });

    try {
      await this.mail.enviarConfirmacaoLogin(
        { nome: user.nome, email: user.email },
        `${urlDoFrontend()}/login/confirmar?token=${token}`,
      );
    } catch (error) {
      await this.prisma.usuario.update({
        where: { id: user.id },
        data: { tokenLoginHash: null, tokenLoginExpiraEm: null },
      });
      throw error;
    }

    return {
      message: 'Enviamos um link de confirmação para o seu e-mail. Ele vale por 5 minutos.',
      confirmacaoPendente: true,
    };
  }

  async confirmarLogin(
    token: string,
    contexto: {
      ip?: string;
      userAgent?: string;
    },
  ) {
    const hash = hashToken(token);
    const user = await this.prisma.usuario.findUnique({
      where: { tokenLoginHash: hash },
      select: { id: true, email: true, papel: true },
    });

    if (!user) {
      throw new BadRequestException(LINK_LOGIN_INVALIDO);
    }

    const consumido = await this.prisma.usuario.updateMany({
      where: {
        id: user.id,
        tokenLoginHash: hash,
        tokenLoginExpiraEm: { gt: new Date() },
      },
      data: { tokenLoginHash: null, tokenLoginExpiraEm: null },
    });

    if (consumido.count !== 1) {
      throw new BadRequestException(LINK_LOGIN_INVALIDO);
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    await this.auditoria.registrar({
      acao: AcaoAuditoria.LOGIN,
      entidade: 'Usuario',
      entidadeId: user.id,
      atorId: user.id,
      detalhes: {
        metodo: 'SENHA',
        confirmacao: 'EMAIL',
      },
      ip: contexto.ip,
      userAgent: contexto.userAgent,
      sucesso: true,
    });

    return {
      message: 'Login realizado com sucesso!',
      access_token: accessToken,
      papel: user.papel,
    };
  }

  async solicitarRecuperacaoSenha(email: string) {
    const resposta = {
      message: 'Se houver uma conta com este e-mail, enviaremos um link para redefinir a senha.',
    };

    const user = await this.prisma.usuario.findUnique({
      where: { email },
      select: { id: true, nome: true, email: true, tokenRecuperacaoExpiraEm: true },
    });

    if (!user || reenvioMuitoRapido(user.tokenRecuperacaoExpiraEm, VALIDADE_LINK_RECUPERACAO_MS)) {
      return resposta;
    }

    const { token, hash } = gerarTokenUsoUnico();

    await this.prisma.usuario.update({
      where: { id: user.id },
      data: {
        tokenRecuperacaoHash: hash,
        tokenRecuperacaoExpiraEm: new Date(Date.now() + VALIDADE_LINK_RECUPERACAO_MS),
      },
    });

    try {
      await this.mail.enviarRecuperacaoSenha(
        { nome: user.nome, email: user.email },
        `${urlDoFrontend()}/redefinir-senha?token=${token}`,
      );
    } catch (error) {
      await this.prisma.usuario.update({
        where: { id: user.id },
        data: { tokenRecuperacaoHash: null, tokenRecuperacaoExpiraEm: null },
      });
      throw error;
    }

    return resposta;
  }

  async redefinirSenha(
    token: string,
    senha: string,
    contexto: {
      ip?: string;
      userAgent?: string;
    },
  ) {
    const hash = hashToken(token);
    const user = await this.prisma.usuario.findUnique({
      where: { tokenRecuperacaoHash: hash },
      select: { id: true },
    });

    if (!user) {
      throw new BadRequestException(LINK_RECUPERACAO_INVALIDO);
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const redefinido = await this.prisma.usuario.updateMany({
      where: {
        id: user.id,
        tokenRecuperacaoHash: hash,
        tokenRecuperacaoExpiraEm: { gt: new Date() },
      },
      data: {
        senhaHash,
        senhaAlteradaEm: new Date(),
        tokenRecuperacaoHash: null,
        tokenRecuperacaoExpiraEm: null,
        tokenLoginHash: null,
        tokenLoginExpiraEm: null,
      },
    });

    if (redefinido.count !== 1) {
      throw new BadRequestException(LINK_RECUPERACAO_INVALIDO);
    }

    await this.auditoria.registrar({
      acao: AcaoAuditoria.ATUALIZAR,
      entidade: 'Usuario',
      entidadeId: user.id,
      atorId: user.id,
      detalhes: {
        motivo: 'RECUPERACAO_SENHA',
      },
      ip: contexto.ip,
      userAgent: contexto.userAgent,
      sucesso: true,
    });

    return { message: 'Senha redefinida com sucesso. Entre com a nova senha.' };
  }
}
