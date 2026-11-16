import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminHistoricoService } from './admin-historico.service';
import { ListarHistoricoDto } from './dto/listar-historico.dto';

@Controller('admin/historico')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminHistoricoController {
  constructor(private readonly historico: AdminHistoricoService) {}
  @Get()
  listar(@Query() filtro: ListarHistoricoDto) {
    return this.historico.listar(filtro);
  }
}
