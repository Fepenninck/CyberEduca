import { LoginRateLimitGuard } from './login-rate-limit.guard';
import { Module, Provider } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from '../prisma.service';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';

const googleStrategyProvider: Provider = {
  provide: GoogleStrategy,
  useFactory: (prisma: PrismaService) => {
    if (
      !process.env.GOOGLE_CLIENT_ID ||
      !process.env.GOOGLE_CLIENT_SECRET ||
      !process.env.GOOGLE_CALLBACK_URL
    ) {
      return null;
    }

    return new GoogleStrategy(prisma);
  },
  inject: [PrismaService],
};

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET!,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [LoginRateLimitGuard, AuthService, PrismaService, JwtStrategy, googleStrategyProvider],
  exports: [JwtModule, PassportModule],
})
export class AuthModule {}
