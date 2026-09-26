import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
=======
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
>>>>>>> 7e0ccd6fa78fcf05f37c1ef0194593bca577f791
import { PrismaService } from '../prisma.service';

@Module({
  imports: [
<<<<<<< HEAD
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'chave_secreta_super_segura',
=======
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'segredo-temporario-dev',
>>>>>>> 7e0ccd6fa78fcf05f37c1ef0194593bca577f791
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
<<<<<<< HEAD
  providers: [AuthService, PrismaService],
=======
  providers: [JwtStrategy, PrismaService],
  exports: [JwtModule, PassportModule],
>>>>>>> 7e0ccd6fa78fcf05f37c1ef0194593bca577f791
})
export class AuthModule {}