import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { IsArray, IsString, IsUUID, MaxLength, ValidateNested, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CertificacoesService } from './certificacoes.service';
class Answer { @IsUUID() questaoId: string; @IsUUID() alternativaId: string; }
export class SubmitCertificationDto {
    @IsString() @MaxLength(32000) token: string;
    @IsArray() @ArrayMaxSize(500) @ValidateNested({ each: true }) @Type(() => Answer) respostas: Answer[];
}
@Controller('certificacoes')
@UseGuards(JwtAuthGuard)
export class CertificacoesController {
    constructor(private readonly service: CertificacoesService) {}
    @Get() status(@Request() request: any) { return this.service.status(request.user.id); }
    @Post(':nivel/iniciar') iniciar(@Param('nivel') nivel: string, @Request() request: any) { return this.service.iniciar(request.user.id, nivel); }
    @Post(':nivel/tentativas') enviar(@Param('nivel') nivel: string, @Request() request: any, @Body() body: SubmitCertificationDto) { return this.service.enviar(request.user.id, nivel, body.token, body.respostas); }
}
