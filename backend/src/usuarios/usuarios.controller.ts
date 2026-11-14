import { Body, Controller, Delete, Get, Patch, Request, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('usuarios')
export class UsuariosController {
    constructor(private readonly usuariosService: UsuariosService) {}

    @UseGuards(JwtAuthGuard)
    @Delete('me')
    async excluirMinhaConta(@Request() req: any, @Body() dados: DeleteAccountDto, @Res({ passthrough: true }) response: Response) {
        const result = await this.usuariosService.excluirConta(req.user.id, dados.confirmacao);
        response.clearCookie('cybereduca_session', { path: '/', httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
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
    @Get('me/desempenho')
    meuDesempenho(@Request() req: any) {
        return this.usuariosService.desempenho(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('me')
    atualizarMeuPerfil(@Request() req: any, @Body() dados: UpdateProfileDto) {
        return this.usuariosService.atualizar(req.user.id, dados);
    }

}
