<<<<<<< HEAD
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
=======
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
>>>>>>> 7e0ccd6fa78fcf05f37c1ef0194593bca577f791
  }
}