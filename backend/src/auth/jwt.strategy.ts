import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { PrismaService } from '../prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const cookie = request.headers.cookie
            ?.split(';')
            .map((item) => item.trim())
            .find((item) => item.startsWith('cybereduca_session='));
          return cookie ? decodeURIComponent(cookie.slice('cybereduca_session='.length)) : null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'chave_secreta_super_segura',
    });
  }

  async validate(payload: { sub: string }) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: { id: true, nome: true, email: true, foto: true, papel: true },
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuario nao encontrado');
    }

    return usuario;
  }
}
