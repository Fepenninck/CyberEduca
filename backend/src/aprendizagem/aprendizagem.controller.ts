import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AprendizagemService } from './aprendizagem.service';

@Controller('trilhas')
export class TrilhasController {
  constructor(private readonly service: AprendizagemService) {}


  @Get()
  listar() {
    return this.service.listarTrilhas();
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
  detalhar(@Param('id') id: string) {
    return this.service.detalharTrilha(id);
  }
}

@Controller('aulas')
export class AulasController {
  constructor(private readonly service: AprendizagemService) {}

  @Get(':id')
  buscar(@Param('id') id: string) {
    return this.service.buscarAula(id);
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
  concluir(@Param('id') id: string) {
    return this.service.concluirAula(id);
  }
}

@Controller('progresso')
export class ProgressoController {
  constructor(private readonly service: AprendizagemService) {}

  @Get()
  geral() {
    return this.service.progressoGeral();
  }
}
