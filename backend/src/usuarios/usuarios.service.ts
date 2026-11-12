import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

const DIA_MS = 24 * 60 * 60 * 1000;

function chaveDoDia(data: Date) {
    return data.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

@Injectable()
export class UsuariosService {
    constructor(private readonly prisma: PrismaService) {}

    async criar(nome: string, email: string, senha: string) {
        const senhaHash = await bcrypt.hash(senha, 10);

        return this.prisma.usuario.create({
            data: {
                nome,
                email,
                senhaHash,
            },
            select: {
                id: true,
                nome: true,
                email: true,
                papel: true,
                criadoEm: true,
                atualizadoEm: true,
            },
        });
    }

    async buscarPorId(id: string) {
        const usuario = await
        this.prisma.usuario.findUnique({
            where: { id },
            select: {
                id: true,
                nome: true,
                email: true,
                papel: true,
                criadoEm: true,
                atualizadoEm: true,
            },
        });

        if (!usuario) {
            throw new NotFoundException('Usuário não encontrado');
        }
        return usuario;
    }

    async buscarPorEmail(email: string) {
        return this.prisma.usuario.findUnique({
            where: { email },
            });
            }
            
            async atualizar(
                id: string,
                dados: { nome?: string; email?: string; foto?: string | null; avatar?: string | null; senha?: string },
            ) {
                const data: {

                    nome?: string;
                    email?: string;
                    foto?: string | null;
                    avatar?: string | null;
                    senhaHash?: string;
                } = {


                nome: dados.nome,
                email: dados.email,
                foto: dados.foto,
                avatar: dados.avatar,
                   
                };

                if (dados.senha) {
                    data.senhaHash = await bcrypt.hash(dados.senha, 10);
                }

                return this.prisma.usuario.update({


                    where: { id },
                    data,
                    select: {
                        id: true,
                        nome: true,
                        email: true,
                        foto: true,
                        avatar: true,
                        papel: true,
                        criadoEm: true,
                        atualizadoEm: true,
                    },
                });
                
            }
            


    async desempenho(usuarioId: string) {
        const agora = new Date();
        const inicioJanela = new Date(agora.getTime() - 60 * DIA_MS);

        const [porAluno, totalAlunos, progressos, phishing, quizzes] = await Promise.all([
            this.prisma.progressoAula.groupBy({
                by: ['usuarioId'],
                where: { concluida: true, usuario: { papel: { not: 'ADMIN' } } },
                _count: { _all: true },
            }),
            this.prisma.usuario.count({ where: { papel: { not: 'ADMIN' } } }),
            this.prisma.progressoAula.findMany({
                where: { usuarioId, concluida: true, dataConclusao: { gte: inicioJanela } },
                select: { dataConclusao: true },
            }),
            this.prisma.tentativaPhishing.findMany({
                where: { usuarioId },
                select: { acertou: true, cenario: { select: { tipo: true } } },
            }),
            this.prisma.tentativaQuiz.findMany({
                where: { usuarioId },
                orderBy: { concluidoEm: 'desc' },
                select: { totalAcertos: true, totalQuestoes: true, quiz: { select: { id: true, titulo: true } } },
            }),
        ]);

        const minhasAulas = porAluno.find((item) => item.usuarioId === usuarioId)?._count._all ?? 0;
        const outrosAlunos = totalAlunos - 1;
        const atras = outrosAlunos > 0
            ? porAluno.filter((item) => item.usuarioId !== usuarioId && item._count._all < minhasAulas).length
              + (minhasAulas > 0 ? totalAlunos - porAluno.length : 0)
            : 0;

        const dias = new Set(progressos.map((item) => chaveDoDia(item.dataConclusao)));
        const semana = Array.from({ length: 7 }, (_, indice) => {
            const dia = new Date(agora.getTime() - (6 - indice) * DIA_MS);
            const chave = chaveDoDia(dia);
            return { dia: chave, aulas: progressos.filter((item) => chaveDoDia(item.dataConclusao) === chave).length };
        });
        let diasSeguidos = 0;
        let cursor = dias.has(chaveDoDia(agora)) ? agora : new Date(agora.getTime() - DIA_MS);
        while (dias.has(chaveDoDia(cursor))) {
            diasSeguidos++;
            cursor = new Date(cursor.getTime() - DIA_MS);
        }

        const canais = new Map<string, { tipo: string; total: number; acertos: number }>();
        for (const tentativa of phishing) {
            const canal = canais.get(tentativa.cenario.tipo) ?? { tipo: tentativa.cenario.tipo, total: 0, acertos: 0 };
            canal.total++;
            if (tentativa.acertou) canal.acertos++;
            canais.set(canal.tipo, canal);
        }

        const quizzesFeitos = quizzes
            .filter((item) => item.totalQuestoes > 0)
            .map((item) => ({
                quizId: item.quiz.id,
                titulo: item.quiz.titulo,
                percentual: Math.round((item.totalAcertos / item.totalQuestoes) * 100),
            }));
        const ordenados = [...quizzesFeitos].sort((a, b) => b.percentual - a.percentual);

        return {
            comparativo: {
                aulasConcluidas: minhasAulas,
                totalAlunos,
                percentil: outrosAlunos > 0 ? Math.round((atras / outrosAlunos) * 100) : null,
            },
            ritmo: {
                diasSeguidos,
                aulasNaSemana: semana.reduce((total, item) => total + item.aulas, 0),
                semana,
            },
            phishing: {
                respondidos: phishing.length,
                acertos: phishing.filter((item) => item.acertou).length,
                porTipo: [...canais.values()],
            },
            quizzes: {
                feitos: quizzesFeitos.length,
                media: quizzesFeitos.length
                    ? Math.round(quizzesFeitos.reduce((total, item) => total + item.percentual, 0) / quizzesFeitos.length)
                    : null,
                melhor: ordenados[0] ?? null,
                revisar: ordenados.length > 1 && ordenados[ordenados.length - 1].percentual < 70 ? ordenados[ordenados.length - 1] : null,
            },
        };
    }

}
