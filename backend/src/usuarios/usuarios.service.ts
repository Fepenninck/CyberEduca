import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

const DIA_MS = 24 * 60 * 60 * 1000;

function chaveDoDia(data: Date) {
    return data.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

@Injectable()
export class UsuariosService {
    constructor(private readonly prisma: PrismaService) {}

    async excluirConta(usuarioId: string, confirmacao: string) {
        if (confirmacao !== 'excluir') throw new BadRequestException('Digite excluir para confirmar a exclusão da conta.');
        await this.prisma.$transaction(async tx => {
            const usuario = await tx.usuario.findUnique({ where: { id: usuarioId }, select: { email: true } });
            if (!usuario) throw new NotFoundException('Conta não encontrada.');
            await tx.logAuditoria.deleteMany({ where: { OR: [
                { atorId: usuarioId }, { entidadeId: usuarioId },
                { entidade: 'Usuario', acao: 'LOGIN_FALHOU', detalhes: { path: ['emailInformado'], equals: usuario.email } },
            ] } });
            // Foreign-key cascades remove progress, attempts, answers, results and lab history.
            await tx.usuario.delete({ where: { id: usuarioId } });
        });
        return { message: 'Sua conta e seu histórico foram excluídos.' };
    }

    async conquistas(usuarioId: string) {
        const aulas = await this.prisma.aula.findMany({
            // Trilha retirada do percurso do aluno; seu histórico é preservado.
            where: { trilhaId: { not: '4328594b-f7cb-52d2-862f-e612b1647aa9' } },
            select: {
                trilha: { select: { nivel: true } },
                progressos: {
                    where: { usuarioId, concluida: true },
                    select: { dataConclusao: true },
                },
            },
        });
        return (['BASICO', 'INTERMEDIARIO', 'AVANCADO'] as const).map(nivel => {
            const doNivel = aulas.filter(aula => aula.trilha.nivel === nivel);
            const concluidas = doNivel.filter(aula => aula.progressos.length > 0);
            const conquistada = doNivel.length > 0 && concluidas.length === doNivel.length;
            return {
                nivel, totalAulas: doNivel.length, aulasConcluidas: concluidas.length, conquistada,
                conquistadaEm: conquistada ? new Date(Math.max(...concluidas.map(aula => aula.progressos[0].dataConclusao.getTime()))).toISOString() : null,
            };
        });
    }

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

        const [progressos, phishing, quizzes, totalAulas, aulasConcluidas, simulacoes, provas, resultadosLegados] = await Promise.all([
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
            this.prisma.aula.count({ where: { trilhaId: { not: '4328594b-f7cb-52d2-862f-e612b1647aa9' } } }),
            this.prisma.progressoAula.count({ where: { usuarioId, concluida: true, aula: { trilhaId: { not: '4328594b-f7cb-52d2-862f-e612b1647aa9' } } } }),
            this.prisma.resultadoSimulacao.findMany({ where: { usuarioId }, select: { acertos: true, totalQuestoes: true } }),
            this.prisma.tentativaProva.findMany({ where: { usuarioId, concluidoEm: { not: null } }, select: { provaId: true, totalAcertos: true, totalQuestoes: true } }),
            this.prisma.resultadoProva.findMany({ where: { usuarioId }, select: { provaId: true, acertos: true, totalQuestoes: true } }),
        ]);

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
        const treinos = simulacoes.filter(item => item.totalQuestoes > 0);
        const totalSimulacoes = treinos.reduce((total, item) => total + item.totalQuestoes, 0) + phishing.length;
        const acertosSimulacoes = treinos.reduce((total, item) => total + item.acertos, 0) + phishing.filter(item => item.acertou).length;
        const provasFinalizadas = provas.filter(item => item.totalQuestoes > 0);
        const idsComTentativa = new Set(provasFinalizadas.map(item => item.provaId));
        const notas = [
            ...provasFinalizadas.map(item => item.totalAcertos / item.totalQuestoes * 100),
            ...resultadosLegados.filter(item => item.totalQuestoes > 0 && !idsComTentativa.has(item.provaId)).map(item => item.acertos / item.totalQuestoes * 100),
        ];

        return {
            aulas: { total: totalAulas, concluidas: aulasConcluidas },
            simulacoes: { realizadas: treinos.length + phishing.length, acertos: acertosSimulacoes, totalQuestoes: totalSimulacoes, aproveitamento: totalSimulacoes ? Math.round(acertosSimulacoes / totalSimulacoes * 100) : null },
            avaliacoes: { realizadas: notas.length, media: notas.length ? Math.round(notas.reduce((sum, nota) => sum + nota, 0) / notas.length) : null, melhor: notas.length ? Math.round(Math.max(...notas)) : null },
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
