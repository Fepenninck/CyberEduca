import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AprendizagemService } from '../aprendizagem/aprendizagem.service';
import { ProvasService } from '../provas/provas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminGuard } from './admin.guard';
import { AdminUsuariosService } from './admin-usuarios.service';
import { CriarAulaAdminDto } from './dto/criar-aula-admin.dto';
import { AtualizarTrilhaAdminDto } from './dto/atualizar-trilha-admin.dto';
import { CriarTrilhaAdminDto } from './dto/criar-trilha-admin.dto';
import { CriarProvaDto } from './dto/criar-prova.dto';
import { AtualizarProvaDto } from './dto/atualizar-prova.dto';
import { CriarQuestaoProvaDto } from './dto/criar-questao-prova.dto';
import { CriarAlternativaProvaDto } from './dto/criar-alternativa-prova.dto';
import { AlterarStatusProvaDto } from './dto/alterar-status-prova.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly dashboardService: AdminDashboardService,
    private readonly usuariosService: AdminUsuariosService,
    private readonly aprendizagemService: AprendizagemService,
    private readonly provasService: ProvasService,
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

  @Delete('usuarios/:id')
  excluirUsuario(@Param('id') id: string) {
    return this.usuariosService.excluirUsuario(id);
  }

  @Patch('usuarios/:id')
  atualizarUsuario(
    @Param('id') id: string,
    @Body() dados: { nome?: string; email?: string },
  ) {
    return this.usuariosService.atualizarUsuario(id, dados);
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
  criarTrilha(@Body() dados: CriarTrilhaAdminDto) {
    return this.aprendizagemService.criarTrilha(dados);
  }

  @Patch('trilhas/:id')
  editarTrilha(
    @Param('id') id: string,
    @Body() dados: AtualizarTrilhaAdminDto,
  ) {
    return this.aprendizagemService.editarTrilha(id, dados);
  }

  @Delete('trilhas/:id')
  excluirTrilha(@Param('id') id: string) {
    return this.aprendizagemService.excluirTrilha(id);
  }

  @Post('aulas')
  criarAula(@Body() dados: CriarAulaAdminDto) {
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

  @Delete('aulas/:id')
  excluirAula(@Param('id') id: string) {
    return this.aprendizagemService.excluirAula(id);
  }

  @Get('provas')
  listarProvas() {
    return this.provasService.listarAdmin();
  }

  @Post('provas')
  criarProva(@Body() dados: CriarProvaDto) {
    return this.provasService.criar(dados);
  }

  @Patch('provas/:id')
  atualizarProva(@Param('id') id: string, @Body() dados: AtualizarProvaDto) {
    return this.provasService.atualizar(id, dados);
  }

  @Patch('provas/:id/status')
  alterarStatusProva(
    @Param('id') id: string,
    @Body() dados: AlterarStatusProvaDto,
  ) {
    return this.provasService.alterarStatus(id, dados.status);
  }

  @Delete('provas/:id')
  excluirProva(@Param('id') id: string) {
    return this.provasService.excluir(id);
  }

  @Post('provas/:provaId/questoes')
  adicionarQuestao(
    @Param('provaId') provaId: string,
    @Body() dados: CriarQuestaoProvaDto,
  ) {
    return this.provasService.adicionarQuestao(provaId, dados);
  }

  @Post('provas/:provaId/questoes/:questaoId/alternativas')
  adicionarAlternativa(
    @Param('provaId') provaId: string,
    @Param('questaoId') questaoId: string,
    @Body() dados: CriarAlternativaProvaDto,
  ) {
    return this.provasService.adicionarAlternativa(provaId, questaoId, dados);
  }
}
