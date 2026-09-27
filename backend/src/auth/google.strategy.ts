import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { PrismaService } from '../prisma.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private prisma: PrismaService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const email = profile.emails?.[0]?.value;
    const nome = profile.displayName;
    const googleId = profile.id;

    if (!email) {
      return done(new Error('Conta Google sem e-mail'), undefined);
    }

    let usuario = await this.prisma.usuario.findUnique({ where: { email } });

    if (!usuario) {
      usuario = await this.prisma.usuario.create({
        data: { nome, email, googleId },
      });
    } else if (!usuario.googleId) {
      usuario = await this.prisma.usuario.update({
        where: { id: usuario.id },
        data: { googleId },
      });
    }

    return done(null, usuario);
  }
}