import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { RegistrarAuditoria } from './types/registrar-auditoria.type';

@Injectable()
export class AuditoriaService {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(dados: RegistrarAuditoria): Promise<void> {
    await this.prisma.logAuditoria.create({
      data: {
        acao: dados.acao,
        entidade: dados.entidade,
        entidadeId: dados.entidadeId,
        atorId: dados.atorId,
        dadosAnteriores: dados.dadosAnteriores,
        dadosNovos: dados.dadosNovos,
        detalhes: dados.detalhes,
        ip: dados.ip,
        userAgent: dados.userAgent,
        sucesso: dados.sucesso ?? true,
        erro: dados.erro,
      },
    });
  }
}
