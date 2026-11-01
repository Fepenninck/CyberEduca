import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AprendizagemService } from '../aprendizagem/aprendizagem.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminGuard } from './admin.guard';
import { AdminUsuariosService } from './admin-usuarios.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly dashboardService: AdminDashboardService,
    private readonly usuariosService: AdminUsuariosService,
    private readonly aprendizagemService: AprendizagemService,
  ) {}

  @Get('dashboard')
  buscarResumoDashboard() {
    return this.dashboardService.buscarResumoDashboard();
  }

  @Get('usuarios')
  listarUsuarios() {
    return this.usuariosService.listarUsuarios();
  }

  @Get('usuarios/:usuarioId')
  buscarUsuario(@Param('usuarioId') usuarioId: string) {
    return this.usuariosService.buscarUsuario(usuarioId);
  }

  @Get('trilhas')
  listarTrilhas() {
    return this.aprendizagemService.listarTrilhasAdmin();
  }

  @Get('aulas')
  listarAulas() {
    return this.aprendizagemService.listarAulasAdmin();
  }

  @Post('trilhas')
  criarTrilha(
    @Body()
    dados: {
      titulo: string;
      descricao: string;
      bloqueada?: boolean;
      ordem: number;
    },
  ) {
    return this.aprendizagemService.criarTrilha(dados);
  }

  @Patch('trilhas/:id')
  editarTrilha(
    @Param('id') id: string,
    @Body()
    dados: {
      titulo?: string;
      descricao?: string;
      bloqueada?: boolean;
      ordem?: number;
    },
  ) {
    return this.aprendizagemService.editarTrilha(id, dados);
  }

  @Post('aulas')
  criarAula(
    @Body()
    dados: {
      titulo: string;
      conteudo: string;
      ordem: number;
      trilhaId: string;
    },
  ) {
    return this.aprendizagemService.criarAula(dados);
  }

  @Patch('aulas/:id')
  editarAula(
    @Param('id') id: string,
    @Body()
    dados: {
      titulo?: string;
      conteudo?: string;
      ordem?: number;
      trilhaId?: string;
    },
  ) {
    return this.aprendizagemService.editarAula(id, dados);
  }
}
