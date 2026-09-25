import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'segredo-temporario-dev',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [JwtStrategy, PrismaService],
  exports: [JwtModule],
})
export class AuthModule {}