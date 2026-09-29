import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('usuarios')
export class UsuariosController {
    constructor(private readonly usuariosService: UsuariosService) {}

    @Post()
    criar(
        @Body() dados: { nome: string; email: string; senha: string },
    ) {
        return this.usuariosService.criar(
            dados.nome,
            dados.email,
            dados.senha,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    meuPerfil(@Request() req: any) {
        return req.user;
    }

    @Get(':id')
    buscarPorId(@Param('id') id: string) {
        return this.usuariosService.buscarPorId(id);
    }

    @Patch(':id')
    atualizar(
        @Param('id') id: string,
        @Body() dados: { nome?: string; email?: string; senha?: string },
    ) {
        return this.usuariosService.atualizar(id, dados);
    }
    
}