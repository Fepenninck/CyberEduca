import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import { loadCertificationProgress } from '../certificacoes/certification-progress';

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
        return (await loadCertificationProgress(this.prisma, usuarioId)).map(({ nivel, totalAulas, aulasConcluidas, conquistada, conquistadaEm, desbloqueado }) => ({ nivel, totalAulas, aulasConcluidas, conquistada, conquistadaEm, desbloqueado }));
    }

    async conquistaLaboratorio(usuarioId: string) {
        const primeiraConsulta = await this.prisma.consultaSeguranca.findFirst({
            where: { usuarioId },
            orderBy: [{ consultadoEm: 'asc' }, { id: 'asc' }],
            select: { consultadoEm: true },
        });
        return {
            conquistada: Boolean(primeiraConsulta),
            conquistadaEm: primeiraConsulta?.consultadoEm.toISOString() ?? null,
        };
    }

    async conquistaQuizzes(usuarioId: string) {
        const quizzes = await this.prisma.quiz.findMany({
            where: { status: 'PUBLICADO' },
            select: {
                questoes: { select: { id: true } },
                tentativas: { where: { usuarioId }, orderBy: { concluidoEm: 'asc' },
                    select: { totalQuestoes: true, concluidoEm: true, respostas: { select: { questaoId: true } } } },
            },
        });
        const datas: Date[] = [];
        for (const quiz of quizzes) {
            const atuais = new Set(quiz.questoes.map(item => item.id));
            if (!atuais.size) continue;
            const conclusao = quiz.tentativas.find(item => item.totalQuestoes === atuais.size &&
                item.respostas.length === atuais.size && new Set(item.respostas.map(resposta => resposta.questaoId)).size === atuais.size &&
                item.respostas.every(resposta => atuais.has(resposta.questaoId)));
            if (conclusao) datas.push(conclusao.concluidoEm);
        }
        const conquistada = quizzes.length > 0 && datas.length === quizzes.length;
        return {
            totalQuizzes: quizzes.length,
            quizzesConcluidos: datas.length,
            conquistada,
            conquistadaEm: conquistada ? new Date(Math.max(...datas.map(data => data.getTime()))).toISOString() : null,
        };
    }

    async conquistaSimulacoes(usuarioId: string) {
        const [simulacoes, cenarios] = await Promise.all([
            this.prisma.simulacao.findMany({
                where: { questoes: { some: {} } },
                select: { resultados: { where: { usuarioId }, orderBy: { criadoEm: 'asc' }, take: 1, select: { criadoEm: true } } },
            }),
            this.prisma.cenarioPhishing.findMany({
                where: { status: 'PUBLICADO' },
                select: { tentativas: { where: { usuarioId }, orderBy: { concluidoEm: 'asc' }, take: 1, select: { concluidoEm: true } } },
            }),
        ]);
        // As duas modalidades compõem o catálogo de Simulações do aluno.
        const conclusoes = [
            ...simulacoes.map(item => item.resultados[0]?.criadoEm),
            ...cenarios.map(item => item.tentativas[0]?.concluidoEm),
        ];
        const totalSimulacoes = conclusoes.length;
        const datas = conclusoes.filter((data): data is Date => Boolean(data));
        const conquistada = totalSimulacoes > 0 && datas.length === totalSimulacoes;
        return {
            totalSimulacoes,
            simulacoesConcluidas: datas.length,
            conquistada,
            conquistadaEm: conquistada ? new Date(Math.max(...datas.map(data => data.getTime()))).toISOString() : null,
        };
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
        const [totalQuizzes, totalTreinos, totalCenarios, totalAvaliacoes] = await Promise.all([
            this.prisma.quiz.count({ where: { status: 'PUBLICADO', questoes: { some: {} } } }),
            this.prisma.simulacao.count({ where: { questoes: { some: {} } } }),
            this.prisma.cenarioPhishing.count({ where: { status: 'PUBLICADO' } }),
            this.prisma.prova.count({ where: { status: 'PUBLICADO', questoes: { some: {} } } }),
        ]);
        const conclusao = (feitas: number, total: number) => total > 0 ? Math.min(100, Math.round(feitas / total * 100)) : 0;

        const [progressos, phishing, quizzes, totalAulas, aulasConcluidas, simulacoes, provas, resultadosLegados] = await Promise.all([
            this.prisma.progressoAula.findMany({
                where: { usuarioId, concluida: true, aula: { trilhaId: { not: '4328594b-f7cb-52d2-862f-e612b1647aa9' } } },
                select: { dataConclusao: true },
            }),
            this.prisma.tentativaPhishing.findMany({
                where: { usuarioId, cenario: { status: 'PUBLICADO' } },
                select: { acertou: true, cenarioId: true, cenario: { select: { tipo: true, titulo: true } } },
            }),
            this.prisma.tentativaQuiz.findMany({
                where: { usuarioId, quiz: { status: 'PUBLICADO' } },
                orderBy: { concluidoEm: 'desc' },
                select: {
                    totalAcertos: true, totalQuestoes: true,
                    respostas: { select: { questaoId: true, acertou: true } },
                    quiz: { select: { id: true, titulo: true, questoes: { select: { id: true } } } },
                },
            }),
            this.prisma.aula.count({ where: { trilhaId: { not: '4328594b-f7cb-52d2-862f-e612b1647aa9' } } }),
            this.prisma.progressoAula.count({ where: { usuarioId, concluida: true, aula: { trilhaId: { not: '4328594b-f7cb-52d2-862f-e612b1647aa9' } } } }),
            this.prisma.resultadoSimulacao.findMany({ where: { usuarioId }, select: { simulacaoId: true, acertos: true, totalQuestoes: true, simulacao: { select: { titulo: true } } } }),
            this.prisma.tentativaProva.findMany({ where: { usuarioId, concluidoEm: { not: null }, prova: { status: 'PUBLICADO', questoes: { some: {} } } }, orderBy: { concluidoEm: 'desc' }, select: { provaId: true, totalAcertos: true, totalQuestoes: true, prova: { select: { trilha: { select: { nivel: true } } } } } }),
            this.prisma.resultadoProva.findMany({ where: { usuarioId, prova: { status: 'PUBLICADO', questoes: { some: {} } } }, orderBy: { criadoEm: 'desc' }, select: { provaId: true, acertos: true, totalQuestoes: true, prova: { select: { trilha: { select: { nivel: true } } } } } }),
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
            .filter((item) => {
                const atuais = new Set(item.quiz.questoes.map(questao => questao.id));
                return item.totalQuestoes > 0 && item.totalQuestoes === atuais.size &&
                    item.respostas.length === atuais.size &&
                    new Set(item.respostas.map(resposta => resposta.questaoId)).size === atuais.size &&
                    item.respostas.every(resposta => atuais.has(resposta.questaoId)) &&
                    item.totalAcertos === item.respostas.filter(resposta => resposta.acertou).length;
            })
            .map((item) => ({
                quizId: item.quiz.id,
                titulo: item.quiz.titulo,
                acertos: item.totalAcertos,
                totalQuestoes: item.totalQuestoes,
                percentual: Math.round((item.totalAcertos / item.totalQuestoes) * 100),
            }));
        const quizzesAgrupados = new Map<string, { quizId: string; titulo: string; acertos: number; totalQuestoes: number }>();
        for (const tentativa of quizzesFeitos) {
            const atual = quizzesAgrupados.get(tentativa.quizId) ?? { quizId: tentativa.quizId, titulo: tentativa.titulo, acertos: 0, totalQuestoes: 0 };
            atual.acertos += tentativa.acertos;
            atual.totalQuestoes += tentativa.totalQuestoes;
            quizzesAgrupados.set(tentativa.quizId, atual);
        }
        const desempenhoPorQuiz = [...quizzesAgrupados.values()].map((quiz) => ({
            ...quiz,
            percentual: Math.round((quiz.acertos / quiz.totalQuestoes) * 100),
        }));
        const ordenados = [...desempenhoPorQuiz].sort((a, b) => b.percentual - a.percentual);
        const treinos = simulacoes.filter(item => item.totalQuestoes > 0);
        const totalSimulacoes = treinos.reduce((total, item) => total + item.totalQuestoes, 0) + phishing.length;
        const acertosSimulacoes = treinos.reduce((total, item) => total + item.acertos, 0) + phishing.filter(item => item.acertou).length;
        const provasFinalizadas = provas.filter(item => item.totalQuestoes > 0);
        const idsComTentativa = new Set(provasFinalizadas.map(item => item.provaId));
        const notas = [
            ...provasFinalizadas.map(item => ({ id: item.provaId, nivel: item.prova.trilha.nivel, acertos: item.totalAcertos, totalQuestoes: item.totalQuestoes, nota: Math.round(item.totalAcertos / item.totalQuestoes * 100) })),
            ...resultadosLegados.filter(item => item.totalQuestoes > 0 && !idsComTentativa.has(item.provaId)).map(item => ({ id: item.provaId, nivel: item.prova.trilha.nivel, acertos: item.acertos, totalQuestoes: item.totalQuestoes, nota: Math.round(item.acertos / item.totalQuestoes * 100) })),
        ];
        const notasPorNivel = new Map<string, { nivel: string; soma: number; tentativas: number }>();
        for (const item of notas) {
            const atual = notasPorNivel.get(item.nivel) ?? { nivel: item.nivel, soma: 0, tentativas: 0 };
            atual.soma += item.nota;
            atual.tentativas++;
            notasPorNivel.set(item.nivel, atual);
        }
        const desempenhoPorNivel = [...notasPorNivel.values()].map(item => ({ nivel: item.nivel, media: Math.round(item.soma / item.tentativas), tentativas: item.tentativas }));
        const niveisOrdenados = [...desempenhoPorNivel].sort((a, b) => b.media - a.media);

        const resumir = (itens: Array<{ id: string; titulo: string; acertos: number; totalQuestoes: number }>) => {
            const grupos = new Map<string, { id: string; titulo: string; acertos: number; totalQuestoes: number }>();
            for (const item of itens) {
                const grupo = grupos.get(item.id) ?? { id: item.id, titulo: item.titulo, acertos: 0, totalQuestoes: 0 };
                grupo.acertos += item.acertos;
                grupo.totalQuestoes += item.totalQuestoes;
                grupos.set(item.id, grupo);
            }
            const ordenados = [...grupos.values()].map(item => ({ ...item, percentual: Math.round(item.acertos / item.totalQuestoes * 100) })).sort((a, b) => b.percentual - a.percentual);
            return { feitas: grupos.size, melhorResultado: ordenados[0] ?? null, piorResultado: ordenados.at(-1) ?? null };
        };
        const resumoSimulacoes = resumir([
            ...treinos.map(item => ({ id: 'treino:' + item.simulacaoId, titulo: item.simulacao.titulo, acertos: item.acertos, totalQuestoes: item.totalQuestoes })),
            ...phishing.map(item => ({ id: 'phishing:' + item.cenarioId, titulo: item.cenario.titulo, acertos: Number(item.acertou), totalQuestoes: 1 })),
        ]);
        const nomesNiveis: Record<string, string> = { BASICO: 'Básico', INTERMEDIARIO: 'Intermediário', AVANCADO: 'Avançado' };
        const resumoAvaliacoes = resumir(notas.map(item => ({ ...item, titulo: nomesNiveis[item.nivel] ?? item.nivel })));
        const acertosAvaliacoes = notas.reduce((total, item) => total + item.acertos, 0);
        const questoesAvaliacoes = notas.reduce((total, item) => total + item.totalQuestoes, 0);

        return {
            aulas: { total: totalAulas, concluidas: aulasConcluidas },
            simulacoes: { ...resumoSimulacoes, conclusao: conclusao(resumoSimulacoes.feitas, totalTreinos + totalCenarios), realizadas: treinos.length + phishing.length, acertos: acertosSimulacoes, erros: totalSimulacoes - acertosSimulacoes, totalQuestoes: totalSimulacoes, aproveitamento: totalSimulacoes ? Math.round(acertosSimulacoes / totalSimulacoes * 100) : null },
            avaliacoes: {
                ...resumoAvaliacoes,
                conclusao: conclusao(resumoAvaliacoes.feitas, totalAvaliacoes),
                acertos: acertosAvaliacoes,
                erros: questoesAvaliacoes - acertosAvaliacoes,
                realizadas: notas.length,
                media: notas.length ? Math.round(notas.reduce((sum, item) => sum + item.nota, 0) / notas.length) : null,
                melhor: notas.length ? Math.max(...notas.map(item => item.nota)) : null,
                notas,
                melhorNivel: niveisOrdenados[0] ?? null,
                nivelRevisar: niveisOrdenados.at(-1) ?? null,
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
                conclusao: conclusao(desempenhoPorQuiz.length, totalQuizzes),
                feitos: desempenhoPorQuiz.length,
                tentativas: quizzesFeitos.length,
                acertos: quizzesFeitos.reduce((total, item) => total + item.acertos, 0),
                erros: quizzesFeitos.reduce((total, item) => total + item.totalQuestoes - item.acertos, 0),
                media: quizzesFeitos.length
                    ? Math.round(quizzesFeitos.reduce((total, item) => total + item.acertos, 0) / quizzesFeitos.reduce((total, item) => total + item.totalQuestoes, 0) * 100)
                    : null,
                melhor: ordenados[0] ?? null,
                pior: ordenados.at(-1) ?? null,
            },
        };
    }

}
