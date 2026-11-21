import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from '../prisma.service';
import { TermosService } from './termos.service';
import { TermosAdminController } from './termos-admin.controller';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [TermosAdminController],
  providers: [TermosService, PrismaService],
  exports: [TermosService],
})
export class TermosModule {}
