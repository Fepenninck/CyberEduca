import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EnviarRespostasSimulacaoDto } from '../admin/dto/responder-simulacao.dto';
import { SimulacoesService } from './simulacoes.service';
import { FinalizarSimulacaoDto } from './dto/finalizar-simulacao.dto';

@Controller('simulacoes')
@UseGuards(JwtAuthGuard)
export class SimulacoesController {
  constructor(private readonly simulacoesService: SimulacoesService) {}

  @Get()
  listar() {
    return this.simulacoesService.listarParaAluno();
  }

  @Get('categorias')
  listarCategorias() {
    return this.simulacoesService.listarCategoriasParaAluno();
  }

  @Get('categorias/:id')
  buscarCategoria(@Param('id') id: string, @Req() request: { user: { id: string } }) {
    return this.simulacoesService.buscarCategoriaParaAluno(id, request.user.id);
  }

  @Get(':id')
  buscar(@Param('id') id: string, @Req() request: { user: { id: string } }) {
    return this.simulacoesService.buscarParaAluno(id, request.user.id);
  }

  @Get(':id/status')
  status(@Param('id') id: string, @Req() request: { user: { id: string } }) {
    return this.simulacoesService.statusDoAluno(id, request.user.id);
  }

  @Post(':id/respostas')
  responder(
    @Param('id') id: string,
    @Req() request: { user: { id: string } },
    @Body() dados: EnviarRespostasSimulacaoDto,
  ) {
    return this.simulacoesService.responder(id, dados.respostas, request.user.id);
  }

  @Post(':id/finalizar')
  finalizar(
    @Param('id') id: string,
    @Req() request: { user: { id: string } },
    @Body() dados: FinalizarSimulacaoDto,
  ) {
    return this.simulacoesService.finalizarParaAluno(id, request.user.id, dados);
  }
}
