import { Module } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    controllers: [UsuariosController],
    providers: [UsuariosService, PrismaService],
    imports: [AuthModule],
})
export class UsuariosModule {}