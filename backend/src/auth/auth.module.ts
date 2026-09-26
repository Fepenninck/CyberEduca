import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { JwtStrategy } from './jwt.strategy'; // <-- 1. Nova importação adicionada

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'chave_secreta_super_segura',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, JwtStrategy], // <-- 2. JwtStrategy adicionado aqui
})
export class AuthModule {}