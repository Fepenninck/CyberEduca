import { Body, Controller, Get, Patch, Request, UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('usuarios')
export class UsuariosController {
    constructor(private readonly usuariosService: UsuariosService) {}

    @UseGuards(JwtAuthGuard)
    @Get('me')
    meuPerfil(@Request() req: any) {
        return req.user;
    }

    @UseGuards(JwtAuthGuard)
    @Patch('me')
    atualizarMeuPerfil(@Request() req: any, @Body() dados: UpdateProfileDto) {
        return this.usuariosService.atualizar(req.user.id, dados);
    }

}
