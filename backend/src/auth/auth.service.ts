import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AcaoAuditoria } from '@prisma/client';
import { AuditoriaService } from '../auditoria.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async register(dto: RegisterDto) {
    const userExists = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (userExists) {
      throw new BadRequestException('Este e-mail já está em uso.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.usuario.create({
      data: {
        nome: dto.name,
        email: dto.email,
        senhaHash: hashedPassword,
      },
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

    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);

    await this.auditoria.registrar({
      acao: AcaoAuditoria.LOGIN,
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
      message: 'Login realizado com sucesso!',
      access_token: token,
    };
  }
}
