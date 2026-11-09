import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConsultaSegurancaService } from './consulta-seguranca.service';
import { ConsultarDominioDto } from './dto/consultar-dominio.dto';

type RequestAutenticada = Request & {
  user: {
    id: string;
    papel: string;
  };
};

@Controller('seguranca')
@UseGuards(JwtAuthGuard)
export class ConsultaSegurancaController {
  constructor(
    private readonly service: ConsultaSegurancaService,
  ) {}

  @Post('consultar-dominio')
  @HttpCode(HttpStatus.OK)
  consultar(
    @Req() request: RequestAutenticada,
    @Body() dto: ConsultarDominioDto,
  ) {
    return this.service.consultarDominio(
      request.user.id,
      dto.dominio,
    );
  }
}