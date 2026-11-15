import { Body, Controller, Delete, Get, Patch, Request, Res, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SESSION_COOKIE, sessionCookieOptions } from '../auth/session-cookie';

@Controller('usuarios')
export class UsuariosController {
    constructor(
        private readonly usuariosService: UsuariosService,
        private readonly jwtService: JwtService,
    ) {}

    @UseGuards(JwtAuthGuard)
    @Delete('me')
    async excluirMinhaConta(@Request() req: any, @Body() dados: DeleteAccountDto, @Res({ passthrough: true }) response: Response) {
        const result = await this.usuariosService.excluirConta(req.user.id, dados.confirmacao);
        response.clearCookie(SESSION_COOKIE, sessionCookieOptions());
        return result;
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    meuPerfil(@Request() req: any) {
        return req.user;
    }

    @UseGuards(JwtAuthGuard)
    @Get('me/conquistas')
    minhasConquistas(@Request() req: any) {
        return this.usuariosService.conquistas(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me/conquistas/simulacoes')
    minhaConquistaSimulacoes(@Request() req: any) {
        return this.usuariosService.conquistaSimulacoes(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me/desempenho')
    meuDesempenho(@Request() req: any) {
        return this.usuariosService.desempenho(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('me')
    async atualizarMeuPerfil(
        @Request() req: any,
        @Body() dados: UpdateProfileDto,
        @Res({ passthrough: true }) response: Response,
    ) {
        const atualizado = await this.usuariosService.atualizar(req.user.id, dados);
        const emailAlterado = dados.email !== undefined && dados.email !== req.user.email;

        if (dados.senha || emailAlterado) {
            const token = this.jwtService.sign({ sub: atualizado.id, email: atualizado.email });
            response.cookie(SESSION_COOKIE, token, sessionCookieOptions());
        }

        return atualizado;
    }

}
