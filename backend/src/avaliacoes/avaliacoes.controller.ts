import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { AvaliacoesService } from './avaliacoes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('avaliacoes')
@UseGuards(JwtAuthGuard)
export class AvaliacoesController {
  constructor(private readonly service: AvaliacoesService) {}

  @Get('tentativas')
  listarMinhas(@Request() req: any) {
    return this.service.listarMinhasTentativas(req.user.id);
  }

  @Get('tentativas/:tentativaId')
  resultado(
    @Param('tentativaId') tentativaId: string,
    @Request() req: any,
  ) {
    return this.service.buscarResultadoProva(tentativaId, req.user.id);
  }
}
