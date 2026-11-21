import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export async function excluirDadosConta(
  prisma: PrismaService,
  usuarioId: string,
) {
  await prisma.$transaction(async (tx) => {
    const usuario = await tx.usuario.findUnique({
      where: { id: usuarioId },
      select: { email: true },
    });
    if (!usuario) throw new NotFoundException('Conta não encontrada.');
    await tx.logAuditoria.deleteMany({
      where: {
        OR: [
          { atorId: usuarioId },
          { entidadeId: usuarioId },
          {
            entidade: 'Usuario',
            acao: 'LOGIN_FALHOU',
            detalhes: { path: ['emailInformado'], equals: usuario.email },
          },
        ],
      },
    });
    // Foreign-key cascades remove progress, attempts, answers, results and lab history.
    await tx.usuario.delete({ where: { id: usuarioId } });
  });
}
