import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RETIRED_TRACK } from '../certificacoes/certification-progress';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async buscarResumoDashboard() {
    const inicio = new Date();
    inicio.setUTCDate(inicio.getUTCDate() - 90);
    const [totalUsuarios, totalTrilhas, totalAulas, trilhas, aulas, acessos, conclusoesTrilhas] = await Promise.all([
      this.prisma.usuario.count(),
      this.prisma.trilha.count(),
      this.prisma.aula.count(),
      this.prisma.$queryRaw<Array<{ id: string; titulo: string; iniciadas: bigint; concluidas: bigint }>>`
        WITH totais AS (
          SELECT "trilhaId", COUNT(*) AS total FROM "Aula" GROUP BY "trilhaId"
        ), participacoes AS (
          SELECT a."trilhaId", p."usuarioId", COUNT(*) FILTER (WHERE p.concluida) AS feitas
          FROM "ProgressoAula" p
          JOIN "Aula" a ON a.id = p."aulaId"
          JOIN "Usuario" u ON u.id = p."usuarioId"
          WHERE u.papel IN ('USUARIO', 'ALUNO') AND p.concluida = true
          GROUP BY a."trilhaId", p."usuarioId"
        )
        SELECT t.id, t.titulo, COUNT(p."usuarioId") AS iniciadas,
          COUNT(p."usuarioId") FILTER (WHERE p.feitas >= totais.total) AS concluidas
        FROM "Trilha" t
        JOIN totais ON totais."trilhaId" = t.id
        LEFT JOIN participacoes p ON p."trilhaId" = t.id
        WHERE t.id <> ${RETIRED_TRACK}
        GROUP BY t.id, t.titulo
        ORDER BY iniciadas DESC, concluidas DESC, t.titulo ASC, t.id ASC
      `,
      this.prisma.progressoAula.findMany({
        where: { concluida: true, dataConclusao: { gte: inicio }, usuario: { papel: { in: ['USUARIO', 'ALUNO'] } }, aula: { trilhaId: { not: RETIRED_TRACK } } },
        select: { id: true, usuarioId: true, dataConclusao: true },
      }),
      this.prisma.logAuditoria.findMany({
        where: { acao: 'LOGIN', sucesso: true, criadoEm: { gte: inicio }, ator: { papel: { in: ['USUARIO', 'ALUNO'] } } },
        select: { id: true, atorId: true, criadoEm: true },
      }),
      this.prisma.$queryRaw<Array<{ usuarioId: string; nome: string; trilhaId: string; titulo: string; criadoEm: Date }>>`
        SELECT p."usuarioId", u.nome, t.id AS "trilhaId", t.titulo, MAX(p."dataConclusao") AS "criadoEm"
        FROM "ProgressoAula" p
        JOIN "Usuario" u ON u.id = p."usuarioId"
        JOIN "Aula" a ON a.id = p."aulaId"
        JOIN "Trilha" t ON t.id = a."trilhaId"
        WHERE p.concluida = true AND u.papel IN ('USUARIO', 'ALUNO') AND t.id <> ${RETIRED_TRACK}
        GROUP BY p."usuarioId", u.nome, t.id, t.titulo
        HAVING COUNT(*) = (SELECT COUNT(*) FROM "Aula" todas WHERE todas."trilhaId" = t.id)
          AND MAX(p."dataConclusao") >= ${inicio}
        ORDER BY "criadoEm" DESC, t.id, p."usuarioId"
      `,
    ]);

    const ranking = trilhas.map(item => ({
      id: item.id, titulo: item.titulo,
      iniciadas: Number(item.iniciadas), concluidas: Number(item.concluidas),
    }));
    const iniciadas = ranking.reduce((total, item) => total + item.iniciadas, 0);
    const concluidas = ranking.reduce((total, item) => total + item.concluidas, 0);
    return {
      totalUsuarios, totalTrilhas, totalAulas,
      progressoTrilhas: { iniciadas, emAndamento: iniciadas - concluidas, concluidas },
      taxaConclusao: iniciadas > 0 ? concluidas / iniciadas * 100 : null,
      trilhasPopulares: ranking.filter(item => item.iniciadas > 0).slice(0, 5),
      aulasConcluidas: aulas.map(item => ({ id: item.id, usuarioId: item.usuarioId, criadoEm: item.dataConclusao })),
      acessos: acessos.map(item => ({ id: item.id, usuarioId: item.atorId!, criadoEm: item.criadoEm })),
      conclusoesTrilhas,
    };
  }
}
