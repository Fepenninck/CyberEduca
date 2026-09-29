import { Controller, Post, Body, HttpCode, HttpStatus, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(loginDto);
    this.setSessionCookie(response, result.access_token);
    return { message: result.message };
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
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
