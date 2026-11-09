import { Module } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma.service';
import {
  AdminQuizzesController,
  QuizzesController,
} from './quizzes.controller';
import { QuizzesService } from './quizzes.service';

@Module({
  imports: [AuthModule],
  controllers: [
    QuizzesController,
    AdminQuizzesController,
  ],
  providers: [
    PrismaService,
    QuizzesService,
    JwtAuthGuard,
    AdminGuard,
  ],
})
export class QuizzesModule {}