import { LoginRateLimitGuard } from './login-rate-limit.guard';
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
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfirmarTokenDto } from './dto/confirmar-token.dto';
import { EsqueciSenhaDto } from './dto/esqueci-senha.dto';
import { RedefinirSenhaDto } from './dto/redefinir-senha.dto';
import { AcaoAuditoria } from '@prisma/client';
import { AuditoriaService } from '../auditoria.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { GoogleAuthGuard } from './google-auth.guard';
import { SESSION_COOKIE, sessionCookieOptions } from './session-cookie';

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
  @UseGuards(LoginRateLimitGuard)
  async login(@Body() loginDto: LoginDto, @Req() request: Request) {
    return this.authService.login(loginDto, {
      ip: request.ip,
      userAgent: request.get('user-agent'),
    });
  }

  @HttpCode(HttpStatus.OK)
  @Post('login/confirmar')
  async confirmarLogin(
    @Body() dto: ConfirmarTokenDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.confirmarLogin(dto.token, {
      ip: request.ip,
      userAgent: request.get('user-agent'),
    });

    this.setSessionCookie(response, result.access_token);

    return { message: result.message, papel: result.papel };
  }

  @HttpCode(HttpStatus.OK)
  @Post('esqueci-senha')
  async esqueciSenha(@Body() dto: EsqueciSenhaDto) {
    return this.authService.solicitarRecuperacaoSenha(dto.email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('redefinir-senha')
  async redefinirSenha(
    @Body() dto: RedefinirSenhaDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.redefinirSenha(dto.token, dto.senha, {
      ip: request.ip,
      userAgent: request.get('user-agent'),
    });

    response.clearCookie(SESSION_COOKIE, sessionCookieOptions());

    return result;
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

    response.clearCookie(SESSION_COOKIE, sessionCookieOptions());

    return { message: 'Sessão encerrada com sucesso.' };
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async google() {
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
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

  private setSessionCookie(response: Response, token: string) {
    response.cookie(SESSION_COOKIE, token, sessionCookieOptions());
  }
}
