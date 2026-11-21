import { Body, Controller, Get, Header, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { PublicarTermosDto } from './publicar-termos.dto';
import { PrivacidadeService } from './privacidade.service';

@Controller('politicas/privacidade')
export class PrivacidadeController {
  constructor(private readonly privacidade: PrivacidadeService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  buscar() {
    return this.privacidade.atuais();
  }
}

@Controller('admin/privacidade')
@UseGuards(JwtAuthGuard, AdminGuard)
export class PrivacidadeAdminController {
  constructor(private readonly privacidade: PrivacidadeService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  async buscar() {
    return {
      ...(await this.privacidade.atuais()),
      historico: await this.privacidade.historico(),
    };
  }

  @Post()
  publicar(@Body() dados: PublicarTermosDto) {
    return this.privacidade.publicar(dados);
  }
}
