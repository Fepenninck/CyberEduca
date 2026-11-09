import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { DesempenhoService } from './desempenho.service';

@Controller('desempenho')
@UseGuards(JwtAuthGuard)
export class DesempenhoController {
  constructor(private readonly service: DesempenhoService) {}
  @Get('me')
  meu(@Req() req: { user: { id: string } }) {
    return this.service.buscarMeuDesempenho(req.user.id);
  }
  @Get('me/provas')
  provas(@Req() req: { user: { id: string } }) {
    return this.service.buscarHistoricoProvas(req.user.id);
  }
}

@Controller('admin/desempenho')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminDesempenhoController {
  constructor(private readonly service: DesempenhoService) {}
  @Get('usuarios/:usuarioId')
  usuario(@Param('usuarioId', new ParseUUIDPipe()) id: string) {
    return this.service.buscarDesempenhoUsuario(id);
  }
}
