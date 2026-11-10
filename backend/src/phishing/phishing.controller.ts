import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AtualizarCenarioDto } from './dto/atualizar-cenario.dto';
import { AtualizarStatusCenarioDto } from './dto/atualizar-status-cenario.dto';
import { CriarCenarioDto } from './dto/criar-cenario.dto';
import { ResponderCenarioDto } from './dto/responder-cenario.dto';
import { PhishingService } from './phishing.service';

type RequestAutenticada = Request & {
  user: {
    id: string;
    papel: string;
  };
};

@Controller('phishing/cenarios')
@UseGuards(JwtAuthGuard)
export class PhishingController {
  constructor(private readonly service: PhishingService) {}

  @Get()
  listar(
    @Req() request: RequestAutenticada,
    @Query('aulaId', new ParseUUIDPipe({ optional: true }))
    aulaId?: string,
  ) {
    return this.service.listarCenarios(aulaId, request.user.id);
  }

  @Get(':cenarioId')
  buscar(
    @Req() request: RequestAutenticada,
    @Param('cenarioId', new ParseUUIDPipe())
    cenarioId: string,
  ) {
    return this.service.buscarCenario(cenarioId, request.user.id);
  }

  @Post(':cenarioId/tentativas')
  responder(
    @Req() request: RequestAutenticada,
    @Param('cenarioId', new ParseUUIDPipe())
    cenarioId: string,
    @Body() dto: ResponderCenarioDto,
  ) {
    return this.service.responderCenario(
      request.user.id,
      cenarioId,
      dto,
    );
  }
}

@Controller('admin/phishing/cenarios')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminPhishingController {
  constructor(private readonly service: PhishingService) {}

  @Get()
  listar() {
    return this.service.listarCenariosAdmin();
  }

  @Post()
  criar(@Body() dto: CriarCenarioDto) {
    return this.service.criarCenario(dto);
  }

  @Patch(':cenarioId')
  atualizar(
    @Param('cenarioId', new ParseUUIDPipe())
    cenarioId: string,
    @Body() dto: AtualizarCenarioDto,
  ) {
    return this.service.atualizarCenario(cenarioId, dto);
  }

  @Patch(':cenarioId/status')
  atualizarStatus(
    @Param('cenarioId', new ParseUUIDPipe())
    cenarioId: string,
    @Body() dto: AtualizarStatusCenarioDto,
  ) {
    if (dto.status === 'PUBLICADO') {
      return this.service.publicarCenario(cenarioId);
    }

    return this.service.arquivarCenario(cenarioId);
  }
}