import { mascararEmailUsuario } from '../common/privacidade';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { ListarHistoricoDto } from './dto/listar-historico.dto';

@Injectable()
export class AdminHistoricoService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(filtro: ListarHistoricoDto) {
    if (
      filtro.inicio &&
      filtro.fim &&
      new Date(filtro.inicio) > new Date(filtro.fim)
    )
      throw new BadRequestException(
        'O início deve ser anterior ao fim do período.',
      );
    const where: Prisma.LogAuditoriaWhereInput = {
      ...(filtro.usuarioId ? { atorId: filtro.usuarioId } : {}),
      ...(filtro.acao ? { acao: filtro.acao } : {}),
      ...(filtro.resultado ? { sucesso: filtro.resultado === 'sucesso' } : {}),
      ...(filtro.inicio || filtro.fim
        ? {
            criadoEm: {
              ...(filtro.inicio ? { gte: new Date(filtro.inicio) } : {}),
              ...(filtro.fim ? { lte: new Date(filtro.fim) } : {}),
            },
          }
        : {}),
      ...(filtro.busca
        ? {
            OR: [
              { entidade: { contains: filtro.busca, mode: 'insensitive' } },
              {
                ator: {
                  is: { nome: { contains: filtro.busca, mode: 'insensitive' } },
                },
              },
              {
                ator: {
                  is: {
                    email: { contains: filtro.busca, mode: 'insensitive' },
                  },
                },
              },
            ],
          }
        : {}),
    };
    const [registros, total] = await this.prisma.$transaction([
      this.prisma.logAuditoria.findMany({
        where,
        orderBy: [{ criadoEm: 'desc' }, { id: 'desc' }],
        skip: (filtro.pagina - 1) * filtro.limite,
        take: filtro.limite,
        select: {
          id: true,
          acao: true,
          entidade: true,
          entidadeId: true,
          sucesso: true,
          criadoEm: true,
          detalhes: true,
          ator: { select: { id: true, nome: true, email: true } },
        },
      }),
      this.prisma.logAuditoria.count({ where }),
    ]);
    return {
      registros: registros.map(({ detalhes, ...registro }) => {
        const info =
          detalhes && typeof detalhes === 'object' && !Array.isArray(detalhes)
            ? detalhes
            : {};
        return {
          ...registro,
          ...(registro.ator ? { ator: mascararEmailUsuario(registro.ator) } : {}),
          metodo: typeof info.metodo === 'string' ? info.metodo : null,
          rota: typeof info.rota === 'string' ? info.rota : null,
        };
      }),
      total,
      pagina: filtro.pagina,
      limite: filtro.limite,
      paginas: Math.max(1, Math.ceil(total / filtro.limite)),
    };
  }
}
