import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AprendizagemService } from '../aprendizagem/aprendizagem.service';
import { ProvasService } from '../provas/provas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminGuard } from './admin.guard';
import { AdminUsuariosService } from './admin-usuarios.service';
import { AdminService } from './admin.service';
import { CriarAulaAdminDto } from './dto/criar-aula-admin.dto';
import { AtualizarTrilhaAdminDto } from './dto/atualizar-trilha-admin.dto';
import { CriarTrilhaAdminDto } from './dto/criar-trilha-admin.dto';
import { CriarProvaDto } from './dto/criar-prova.dto';
import { AtualizarProvaDto } from './dto/atualizar-prova.dto';
import { CriarQuestaoProvaDto } from './dto/criar-questao-prova.dto';
import { CriarAlternativaProvaDto } from './dto/criar-alternativa-prova.dto';
import { AlterarStatusProvaDto } from './dto/alterar-status-prova.dto';
import { CriarSimulacaoDto } from './dto/criar-simulacao.dto';
import { AtualizarSimulacaoDto } from './dto/atualizar-simulacao.dto';
import { CriarCategoriaSimulacaoDto } from './dto/criar-categoria-simulacao.dto';
import { SimulacoesService } from '../simulacoes/simulacoes.service';
import { DesempenhoService } from '../desempenho/desempenho.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly dashboardService: AdminDashboardService,
    private readonly adminService: AdminService,
    private readonly usuariosService: AdminUsuariosService,
    private readonly aprendizagemService: AprendizagemService,
    private readonly provasService: ProvasService,
    private readonly simulacoesService: SimulacoesService,
    private readonly desempenhoService: DesempenhoService,
  ) {}

  @Get('dashboard')
  buscarResumoDashboard() {
    return this.dashboardService.buscarResumoDashboard();
  }

  @Get('relatorios')
  async relatorios() {
    const usuarios = await this.usuariosService.listarUsuarios();
    return Promise.all(
      usuarios.map((usuario) =>
        this.desempenhoService.buscarDesempenhoUsuario(usuario.id),
      ),
    );
  }

  @Get('resultados/provas')
  listarResultadosProvas() {
    return this.adminService.listarResultadosProvas();
  }

  @Get('resultados/simulacoes')
  listarResultadosSimulacoes() {
    return this.adminService.listarResultadosSimulacoes();
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
  criarProva(
    @Body() dados: CriarProvaDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.provasService.criarProvaIntegrada(dados, req.user.id);
  }

  @Patch('provas/:id')
  atualizarProva(
    @Param('id') id: string,
    @Body() dados: AtualizarProvaDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.provasService.atualizarProvaIntegrada(id, dados, req.user.id);
  }

  @Patch('provas/:id/status')
  alterarStatusProva(
    @Param('id') id: string,
    @Body() dados: AlterarStatusProvaDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.provasService.definirStatusIntegrado(
      id,
      dados.status,
      req.user.id,
    );
  }

  @Delete('provas/:id')
  excluirProva(@Param('id') id: string) {
    return this.provasService.excluir(id);
  }

  @Post('provas/:provaId/questoes')
  adicionarQuestao(
    @Param('provaId') provaId: string,
    @Body() dados: CriarQuestaoProvaDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.provasService.criarQuestaoIntegrada(
      provaId,
      dados,
      req.user.id,
    );
  }

  @Post('provas/:provaId/questoes/:questaoId/alternativas')
  adicionarAlternativa(
    @Param('provaId') provaId: string,
    @Param('questaoId') questaoId: string,
    @Body() dados: CriarAlternativaProvaDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.provasService.criarAlternativaIntegrada(
      provaId,
      questaoId,
      dados,
      req.user.id,
    );
  }

  @Get('simulacoes')
  listarSimulacoes() {
    return this.simulacoesService.listarAdmin();
  }

  @Get('categorias-simulacao')
  listarCategoriasSimulacao() {
    return this.simulacoesService.listarCategoriasAdmin();
  }

  @Post('categorias-simulacao')
  criarCategoriaSimulacao(@Body() dados: CriarCategoriaSimulacaoDto) {
    return this.simulacoesService.criarCategoria(dados);
  }

  @Delete('categorias-simulacao/:id')
  excluirCategoriaSimulacao(@Param('id') id: string) {
    return this.simulacoesService.excluirCategoria(id);
  }

  @Get('simulacoes/:id')
  buscarSimulacao(@Param('id') id: string) {
    return this.simulacoesService.buscarAdmin(id);
  }

  @Post('simulacoes')
  criarSimulacao(@Body() dados: CriarSimulacaoDto) {
    return this.simulacoesService.criar(dados);
  }

  @Patch('simulacoes/:id')
  atualizarSimulacao(
    @Param('id') id: string,
    @Body() dados: AtualizarSimulacaoDto,
  ) {
    return this.simulacoesService.atualizar(id, dados);
  }

  @Delete('simulacoes/:id')
  excluirSimulacao(@Param('id') id: string) {
    return this.simulacoesService.excluir(id);
  }
}
