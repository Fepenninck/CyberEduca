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
import { AtualizarQuizDto } from './dto/atualizar-quiz.dto';
import { AtualizarStatusQuizDto } from './dto/atualizar-status-quiz.dto';
import { CriarAlternativaDto } from './dto/criar-alternativa.dto';
import { CriarQuestaoDto } from './dto/criar-questao.dto';
import { CriarQuizDto } from './dto/criar-quiz.dto';
import { ResponderQuizDto } from './dto/responder-quiz.dto';
import { QuizzesService } from './quizzes.service';

type RequestAutenticada = Request & {
  user: {
    id: string;
    papel: string;
  };
};

@Controller('quizzes')
@UseGuards(JwtAuthGuard)
export class QuizzesController {
  constructor(private readonly service: QuizzesService) {}

  @Get()
  listar(
    @Query('aulaId', new ParseUUIDPipe({ optional: true }))
    aulaId?: string,
  ) {
    return this.service.listarQuizzes(aulaId);
  }

  @Get(':quizId')
  buscar(
    @Param('quizId', new ParseUUIDPipe())
    quizId: string,
  ) {
    return this.service.buscarQuiz(quizId);
  }

  @Post(':quizId/tentativas')
  responder(
    @Req() request: RequestAutenticada,
    @Param('quizId', new ParseUUIDPipe())
    quizId: string,
    @Body() dto: ResponderQuizDto,
  ) {
    return this.service.responderQuiz(
      request.user.id,
      quizId,
      dto,
    );
  }
}

@Controller('admin/quizzes')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminQuizzesController {
  constructor(private readonly service: QuizzesService) {}

  @Get()
  listar() {
    return this.service.listarQuizzesAdmin();
  }

  @Post()
  criar(@Body() dto: CriarQuizDto) {
    return this.service.criarQuiz(dto);
  }

  @Patch(':quizId')
  atualizar(
    @Param('quizId', new ParseUUIDPipe())
    quizId: string,
    @Body() dto: AtualizarQuizDto,
  ) {
    return this.service.atualizarQuiz(quizId, dto);
  }

  @Post(':quizId/questoes')
  criarQuestao(
    @Param('quizId', new ParseUUIDPipe())
    quizId: string,
    @Body() dto: CriarQuestaoDto,
  ) {
    return this.service.criarQuestao(quizId, dto);
  }

  @Post(':quizId/questoes/:questaoId/alternativas')
  criarAlternativa(
    @Param('quizId', new ParseUUIDPipe())
    quizId: string,
    @Param('questaoId', new ParseUUIDPipe())
    questaoId: string,
    @Body() dto: CriarAlternativaDto,
  ) {
    return this.service.criarAlternativa(
      quizId,
      questaoId,
      dto,
    );
  }

  @Patch(':quizId/status')
  atualizarStatus(
    @Param('quizId', new ParseUUIDPipe())
    quizId: string,
    @Body() dto: AtualizarStatusQuizDto,
  ) {
    if (dto.status === 'PUBLICADO') {
      return this.service.publicarQuiz(quizId);
    }

    return this.service.arquivarQuiz(quizId);
  }
}