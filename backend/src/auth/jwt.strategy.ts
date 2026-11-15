import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { PrismaService } from '../prisma.service';
import { SESSION_COOKIE } from './session-cookie';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const cookie = request.headers.cookie
            ?.split(';')
            .map((item) => item.trim())
            .find((item) => item.startsWith(`${SESSION_COOKIE}=`));
          return cookie
            ? decodeURIComponent(cookie.slice(`${SESSION_COOKIE}=`.length))
            : null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: { sub: string; iat: number }) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        nome: true,
        email: true,
        foto: true,
        avatar: true,
        papel: true,
        senhaHash: true,
        senhaAlteradaEm: true,
      },
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuario nao encontrado');
    }

    if (
      usuario.senhaAlteradaEm &&
      payload.iat < Math.floor(usuario.senhaAlteradaEm.getTime() / 1000)
    ) {
      throw new UnauthorizedException('Sessão encerrada. Entre novamente.');
    }

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      foto: usuario.foto,
      avatar: usuario.avatar,
      papel: usuario.papel,
      temSenha: Boolean(usuario.senhaHash),
    };
  }
}
