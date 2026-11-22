import { Body, Controller, Get, Header, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { TermosService } from './termos.service';
import { PublicarTermosDto } from './publicar-termos.dto';

@Controller('admin/termos')
@UseGuards(JwtAuthGuard, AdminGuard)
export class TermosAdminController {
  constructor(private readonly termos: TermosService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  async buscar() {
    return {
      ...(await this.termos.atuais()),
      historico: await this.termos.historico(),
    };
  }

  @Post()
  publicar(@Body() dados: PublicarTermosDto) {
    return this.termos.publicar(dados);
  }
}
