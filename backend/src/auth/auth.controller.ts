import { Body, Controller, NotFoundException, Post } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';

@Controller('auth')
export class AuthController {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  // TEMPORARIO: gera token sem validar senha.
  // Sera substituido pelo POST /auth/login do Caio.
  @Post('token-teste')
  async tokenTeste(@Body() dados: { email: string }) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dados.email },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    return {
      access_token: this.jwt.sign({ sub: usuario.id, email: usuario.email }),
    };
  }
}