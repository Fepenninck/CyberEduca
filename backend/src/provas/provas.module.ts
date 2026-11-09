import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma.service';
import { ProvasController } from './provas.controller';
import { ProvasService } from './provas.service';

@Module({
  imports: [AuthModule],
  controllers: [ProvasController],
  providers: [ProvasService, PrismaService],
  exports: [ProvasService],
})
export class ProvasModule {}
