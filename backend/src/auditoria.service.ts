import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { RegistrarAuditoria } from './types/registrar-auditoria.type';
import { AuditoriaContexto } from './auditoria-contexto';

@Injectable()
export class AuditoriaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contexto: AuditoriaContexto = new AuditoriaContexto(),
  ) {}

  async registrar(dados: RegistrarAuditoria): Promise<void> {
    const contexto = this.contexto.storage.getStore();
    await this.prisma.logAuditoria.create({
      data: {
        acao: dados.acao,
        entidade: dados.entidade,
        entidadeId: dados.entidadeId,
        atorId: dados.atorId ?? contexto?.atorId,
        dadosAnteriores: dados.dadosAnteriores,
        dadosNovos: dados.dadosNovos,
        detalhes: dados.detalhes,
        ip: dados.ip ?? contexto?.ip,
        userAgent: dados.userAgent ?? contexto?.userAgent,
        sucesso: dados.sucesso ?? true,
        erro: dados.erro,
      },
    });
    if (contexto) contexto.registrados += 1;
  }
}
