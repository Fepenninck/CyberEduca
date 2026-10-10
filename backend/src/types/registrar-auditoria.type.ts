import { AcaoAuditoria, Prisma } from '@prisma/client';

export type RegistrarAuditoria = {
  acao: AcaoAuditoria;
  entidade: string;
  entidadeId?: string;
  atorId?: string;
  dadosAnteriores?: Prisma.InputJsonValue;
  dadosNovos?: Prisma.InputJsonValue;
  detalhes?: Prisma.InputJsonValue;
  ip?: string;
  userAgent?: string;
  sucesso?: boolean;
  erro?: string;
};
