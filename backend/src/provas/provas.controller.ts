import { Req } from '@nestjs/common';
import { ResponderProvaDto } from './dto/responder-prova.dto';
import { FinalizarProvaDto } from './dto/finalizar-prova.dto';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ProvasService } from './provas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CriarProvaDto } from './dto/criar-prova.dto';
import { AtualizarProvaDto } from './dto/atualizar-prova.dto';
import { AtualizarStatusProvaDto } from './dto/atualizar-status-prova.dto';
import { CriarQuestaoProvaDto } from './dto/criar-questao-prova.dto';
import { CriarAlternativaProvaDto } from './dto/criar-alternativa-prova.dto';
import { EnviarTentativaProvaDto } from './dto/enviar-tentativa-prova.dto';

// Endpoints administrativos consumidos pelo painel do Caio.
@Controller('admin/provas')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminProvasController {
  constructor(private readonly service: ProvasService) {}

  @Get()
  listar() {
    return this.service.listarProvasAdmin();
  }

  @Post()
  criar(@Body() dados: CriarProvaDto, @Request() req: any) {
    return this.service.criarProva(dados, req.user.id);
  }

  @Patch(':provaId')
  atualizar(
    @Param('provaId') provaId: string,
    @Body() dados: AtualizarProvaDto,
    @Request() req: any,
  ) {
    return this.service.atualizarProva(provaId, dados, req.user.id);
  }

  @Post(':provaId/questoes')
  criarQuestao(
    @Param('provaId') provaId: string,
    @Body() dados: CriarQuestaoProvaDto,
    @Request() req: any,
  ) {
    return this.service.criarQuestao(provaId, dados, req.user.id);
  }

  @Post(':provaId/questoes/:questaoId/alternativas')
  criarAlternativa(
    @Param('provaId') provaId: string,
    @Param('questaoId') questaoId: string,
    @Body() dados: CriarAlternativaProvaDto,
    @Request() req: any,
  ) {
    return this.service.criarAlternativa(
      provaId,
      questaoId,
      dados,
      req.user.id,
    );
  }

  @Patch(':provaId/status')
  alterarStatus(
    @Param('provaId') provaId: string,
    @Body() dados: AtualizarStatusProvaDto,
    @Request() req: any,
  ) {
    if (dados.status === 'PUBLICADO') {
      return this.service.publicarProva(provaId, req.user.id);
    }

    if (dados.status === 'ARQUIVADO') {
      return this.service.arquivarProva(provaId, req.user.id);
    }

    return this.service.alterarStatusProva(provaId, 'RASCUNHO', req.user.id);
  }
}

// Endpoints do aluno.
@Controller('provas')
@UseGuards(JwtAuthGuard)
export class ProvasController {
  constructor(private readonly service: ProvasService) {}

  @Get()
  listar(@Query('trilhaId') trilhaId?: string) {
    return this.service.listarProvas(trilhaId);
  }

  @Get(':provaId')
  buscar(@Param('provaId') provaId: string) {
    return this.service.buscarProva(provaId);
  }

  @Post(':provaId/tentativas')
  enviarTentativa(
    @Param('provaId') provaId: string,
    @Body() dados: EnviarTentativaProvaDto,
    @Request() req: any,
  ) {
    return this.service.enviarTentativa(provaId, req.user.id, dados);
  }
  @Get(':id/status')
  status(@Param('id') id: string, @Req() request: { user: { id: string } }) {
    return this.service.statusDoAluno(id, request.user.id);
  }

  @Post(':id/respostas')
  corrigirRespostas(
    @Param('id') id: string,
    @Req() request: { user: { id: string } },
    @Body() dados: ResponderProvaDto,
  ) {
    return this.service.corrigirRespostas(id, dados.respostas, request.user.id);
  }

  @Post(':id/finalizar')
  finalizar(
    @Param('id') id: string,
    @Req() request: { user: { id: string } },
    @Body() dados: FinalizarProvaDto,
  ) {
    return this.service.finalizarParaAluno(id, request.user.id, dados);
  }
}
