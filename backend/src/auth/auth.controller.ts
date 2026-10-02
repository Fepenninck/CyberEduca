import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AcaoAuditoria } from '@prisma/client';
import { AuditoriaService } from '../auditoria.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly auditoria: AuditoriaService,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Req() request: Request) {
    return this.authService.register(registerDto, {
      ip: request.ip,
      userAgent: request.get('user-agent'),
    });
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(loginDto, {
      ip: request.ip,
      userAgent: request.get('user-agent'),
    });

    this.setSessionCookie(response, result.access_token);

    return { message: result.message };
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req() request: any,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auditoria.registrar({
      acao: AcaoAuditoria.LOGOUT,
      entidade: 'Usuario',
      entidadeId: request.user.id,
      atorId: request.user.id,
      ip: request.ip,
      userAgent: request.get('user-agent'),
      sucesso: true,
    });

    response.clearCookie('cybereduca_session', this.cookieOptions());

    return { message: 'Sessão encerrada com sucesso.' };
  }

  // Inicia o fluxo: redireciona o usuario para a tela do Google
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async google() {
    // o guard cuida do redirecionamento
  }

  // O Google retorna aqui depois que o usuario autoriza
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: Response) {
    const payload = { sub: req.user.id, email: req.user.email };
    const token = this.jwtService.sign(payload);
    this.setSessionCookie(res, token);
    await this.auditoria.registrar({
      acao: AcaoAuditoria.LOGIN,
      entidade: 'Usuario',
      entidadeId: req.user.id,
      atorId: req.user.id,
      detalhes: {
        metodo: 'GOOGLE',
      },
      ip: req.ip,
      userAgent: req.get('user-agent'),
      sucesso: true,
    });
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    };
  }

  private setSessionCookie(response: Response, token: string) {
    response.cookie('cybereduca_session', token, this.cookieOptions());
  }
}
