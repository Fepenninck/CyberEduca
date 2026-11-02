import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProvasService } from './provas.service';
import { ResponderProvaDto } from './dto/responder-prova.dto';

@Controller('provas')
@UseGuards(JwtAuthGuard)
export class ProvasController {
  constructor(private readonly provasService: ProvasService) {}

  @Get()
  listarPublicadas() {
    return this.provasService.listarPublicadas();
  }

  @Get(':id')
  buscarPublicada(@Param('id') id: string) {
    return this.provasService.buscarPublicada(id);
  }

  @Post(':id/respostas')
  corrigirRespostas(
    @Param('id') id: string,
    @Body() dados: ResponderProvaDto,
  ) {
    return this.provasService.corrigirRespostas(id, dados.respostas);
  }
}
