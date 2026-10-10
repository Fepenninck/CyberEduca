import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards, } from '@nestjs/common';
import { AprendizagemService } from './aprendizagem.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('trilhas')
@UseGuards(JwtAuthGuard)
export class TrilhasController {
  constructor(private readonly service: AprendizagemService) {}


  @Get()
  listar(@Request() req: any) {
    return this.service.listarTrilhas(req.user.id);
  }

  @Post()
  criar(
    @Body()
    dados: {
      titulo: string;
      descricao: string;
      ordem: number;
    },
  ) {
    return this.service.criarTrilha(dados);
}

@Patch(':id')
editar(
  @Param('id') id: string,
  @Body()
  dados: {
    titulo?: string;
    descricao?: string;
    ordem?: number;
  },
) {
  return this.service.editarTrilha(id, dados);
}

  @Get(':id')
detalhar(@Param('id') id: string, @Request() req: any) {
  return this.service.detalharTrilha(id, req.user.id);
  }
}

@Controller('aulas')
@UseGuards(JwtAuthGuard)
export class AulasController {
  constructor(private readonly service: AprendizagemService) {}

  @Get(':id')
buscar(@Param('id') id: string, @Request() req: any) {
  return this.service.buscarAula(id, req.user.id);
  }

@Post()
criar(
  @Body()
  dados: {
    titulo: string;
    conteudo: string;
    ordem: number;
    trilhaId: string;
  },
) {
  return this.service.criarAula(dados);
}

@Patch(':id')
editar(
  @Param('id') id: string,
  @Body()
  dados: {
    titulo?: string;
    conteudo?: string;
    ordem?: number;
    trilhaId?: string;
  },
) {
  return this.service.editarAula(id, dados);
}

  @Post(':id/concluir')
concluir(@Param('id') id: string, @Request() req: any) {
  return this.service.concluirAula(id, req.user.id);
  }
}

@Controller('progresso')
@UseGuards(JwtAuthGuard)
export class ProgressoController {
  constructor(private readonly service: AprendizagemService) {}

  @Get()
geral(@Request() req: any) {
  return this.service.progressoGeral(req.user.id);
}
}


