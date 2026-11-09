import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProvasService } from './provas.service';
import { ResponderProvaDto } from './dto/responder-prova.dto';
import { FinalizarProvaDto } from './dto/finalizar-prova.dto';

@Controller('provas')
@UseGuards(JwtAuthGuard)
export class ProvasController {
  constructor(private readonly provasService: ProvasService) {}

  @Get()
  listarPublicadas() {
    return this.provasService.listarPublicadas();
  }

  @Get(':id')
  buscarPublicada(@Param('id') id: string, @Req() request: { user: { id: string } }) {
    return this.provasService.buscarPublicada(id, request.user.id);
  }

  @Get(':id/status')
  status(@Param('id') id: string, @Req() request: { user: { id: string } }) {
    return this.provasService.statusDoAluno(id, request.user.id);
  }

  @Post(':id/respostas')
  corrigirRespostas(
    @Param('id') id: string,
    @Req() request: { user: { id: string } },
    @Body() dados: ResponderProvaDto,
  ) {
    return this.provasService.corrigirRespostas(id, dados.respostas, request.user.id);
  }

  @Post(':id/finalizar')
  finalizar(
    @Param('id') id: string,
    @Req() request: { user: { id: string } },
    @Body() dados: FinalizarProvaDto,
  ) {
    return this.provasService.finalizarParaAluno(id, request.user.id, dados);
  }
}
