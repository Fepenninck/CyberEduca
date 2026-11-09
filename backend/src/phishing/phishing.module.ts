import { Module } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma.service';
import {
  AdminPhishingController,
  PhishingController,
} from './phishing.controller';
import { PhishingService } from './phishing.service';

@Module({
  imports: [AuthModule],
  controllers: [
    PhishingController,
    AdminPhishingController,
  ],
  providers: [
    PrismaService,
    PhishingService,
    JwtAuthGuard,
    AdminGuard,
  ],
})
export class PhishingModule {}