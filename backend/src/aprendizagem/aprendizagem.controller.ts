import { Controller, Get, Param, Post } from '@nestjs/common';
import { AprendizagemService } from './aprendizagem.service';

@Controller('trilhas')
export class TrilhasController {
  constructor(private readonly service: AprendizagemService) {}

  @Get()
  listar() {
    return this.service.listarTrilhas();
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
