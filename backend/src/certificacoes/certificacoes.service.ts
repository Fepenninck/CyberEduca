import { createHash, createHmac } from 'node:crypto';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { CorrecaoProvaService } from '../avaliacoes/correcao-prova.service';
import { clearLessonTag, EXAM_IDS, LEVELS, Level, loadCertificationProgress, passed, PASS_MARK, questionLesson, RETIRED_TRACK } from './certification-progress';

type Session = { purpose: string; sub: string; nivel: Level; previous: string | null; questoes: string[]; revision: string; iat: number };
type BankQuestion = { id: string; enunciado: string; explicacao: string; alternativas: { id: string; texto: string; ordem: number; isCorreta: boolean }[] };
export function selectPaper(bank: BankQuestion[], lessonIds: string[], seed: string, previous: Set<string>) {
    return lessonIds.map(lessonId => {
        const pool = bank.filter(question => questionLesson(question.explicacao) === lessonId && !previous.has(question.id)).sort((a, b) => a.id.localeCompare(b.id));
        if (!pool.length) throw new ServiceUnavailableException('O banco de questões deste nível precisa ser atualizado.');
        return pool[createHash('sha256').update(`${seed}:${lessonId}`).digest().readUInt32BE(0) % pool.length];
    });
}
const revision = (questions: BankQuestion[]) => createHash('sha256').update(JSON.stringify(questions.map(({ id, enunciado, explicacao, alternativas }) => ({ id, enunciado, explicacao, alternativas: alternativas.map(({ id, texto, ordem, isCorreta }) => ({ id, texto, ordem, isCorreta })) })))).digest('hex');

@Injectable()
export class CertificacoesService {
    constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService, private readonly correcao: CorrecaoProvaService) {}
    private secret() {
        if (!process.env.JWT_SECRET) throw new ServiceUnavailableException('Não foi possível preparar a prova.');
        return createHmac('sha256', process.env.JWT_SECRET).update('cybereduca:certificacao:v1').digest('hex');
    }
    private level(value: string): Level {
        if (!LEVELS.includes(value as Level)) throw new NotFoundException('Nível não encontrado.');
        return value as Level;
    }
    status(usuarioId: string) { return loadCertificationProgress(this.prisma, usuarioId); }
    private allowed(state: Awaited<ReturnType<typeof loadCertificationProgress>>[number]) {
        if (state.podeIniciar) return;
        if (state.motivo === 'AGUARDE') throw new ForbiddenException({ message: 'Aguarde 24 horas após a reprovação para uma nova prova.', proximaTentativaEm: state.proximaTentativaEm });
        if (state.motivo === 'APROVADO') throw new ConflictException('Você já foi aprovado neste nível.');
        if (state.motivo === 'BANCO_INCOMPLETO') throw new ServiceUnavailableException('A prova está sendo preparada para cobrir todas as aulas deste nível.');
        throw new ForbiddenException('Conclua todas as aulas deste nível e seja aprovado no nível anterior para fazer a prova.');
    }
    async iniciar(usuarioId: string, value: string) {
        const nivel = this.level(value);
        const state = (await this.status(usuarioId)).find(item => item.nivel === nivel)!;
        this.allowed(state);
        const [prova, lessons, previous] = await Promise.all([
            this.prisma.prova.findUnique({ where: { id: EXAM_IDS[nivel] }, include: { questoes: { orderBy: { ordem: 'asc' }, include: { alternativas: { orderBy: { ordem: 'asc' } } } } } }),
            this.prisma.aula.findMany({ where: { trilha: { nivel, id: { not: RETIRED_TRACK } } }, orderBy: [{ trilha: { ordem: 'asc' } }, { ordem: 'asc' }], select: { id: true } }),
            state.ultimaTentativa ? this.prisma.respostaProva.findMany({ where: { tentativaId: state.ultimaTentativa.id }, select: { questaoId: true } }) : Promise.resolve([]),
        ]);
        if (!prova || prova.status !== 'PUBLICADO') throw new NotFoundException('Prova indisponível.');
        const paper = selectPaper(prova.questoes, lessons.map(item => item.id), `${usuarioId}:${state.ultimaTentativa?.id ?? 'primeira'}`, new Set(previous.map(item => item.questaoId)));
        const token = this.jwt.sign({ purpose: 'certificacao', sub: usuarioId, nivel, previous: state.ultimaTentativa?.id ?? null, questoes: paper.map(item => item.id), revision: revision(paper) }, { secret: this.secret(), expiresIn: '2h' });
        return { nivel, titulo: prova.titulo, notaMinima: PASS_MARK, totalQuestoes: paper.length, token,
            questoes: paper.map((question, index) => ({ id: question.id, enunciado: question.enunciado, ordem: index + 1, alternativas: question.alternativas.map(({ id, texto, ordem }) => ({ id, texto, ordem })) })) };
    }
    async enviar(usuarioId: string, value: string, token: string, respostas: { questaoId: string; alternativaId: string }[]) {
        const nivel = this.level(value);
        let session: Session;
        try { session = this.jwt.verify<Session>(token, { secret: this.secret() }); }
        catch { throw new ForbiddenException('A sessão da prova expirou. Abra a prova novamente pelas trilhas.'); }
        if (session.purpose !== 'certificacao' || session.sub !== usuarioId || session.nivel !== nivel || !Array.isArray(session.questoes)) throw new ForbiddenException('Sessão de prova inválida.');
        return this.prisma.$transaction(async tx => {
            await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${usuarioId}), hashtext('certificacoes'))`;
            const state = (await loadCertificationProgress(tx, usuarioId)).find(item => item.nivel === nivel)!;
            this.allowed(state);
            if ((state.ultimaTentativa?.id ?? null) !== session.previous) throw new ConflictException('Esta tentativa já foi registrada. Volte às trilhas para consultar o resultado.');
            const bank = await tx.questaoProva.findMany({ where: { provaId: EXAM_IDS[nivel], id: { in: session.questoes } }, include: { alternativas: { orderBy: { ordem: 'asc' } } } });
            const paper = session.questoes.map(id => bank.find(question => question.id === id));
            if (paper.some(question => !question) || revision(paper as BankQuestion[]) !== session.revision) throw new ConflictException('A prova foi atualizada. Abra uma nova sessão pelas trilhas.');
            if (respostas.length !== paper.length) throw new BadRequestException('Responda todas as questões da prova.');
            const questions = paper as BankQuestion[];
            const result = this.correcao.corrigirProva(respostas, questions.map(question => ({ questaoId: question.id, alternativasValidas: new Set(question.alternativas.map(item => item.id)), alternativaCorretaId: question.alternativas.find(item => item.isCorreta)?.id ?? null })));
            const now = new Date();
            const attempt = await tx.tentativaProva.create({ data: { usuarioId, provaId: EXAM_IDS[nivel], iniciadoEm: new Date(session.iat * 1000), concluidoEm: now, nota: result.nota, totalAcertos: result.totalAcertos, totalQuestoes: result.totalQuestoes } });
            await tx.respostaProva.createMany({ data: result.respostas.map(answer => ({ tentativaId: attempt.id, ...answer })) });
            await tx.resultadoProva.upsert({ where: { usuarioId_provaId: { usuarioId, provaId: EXAM_IDS[nivel] } }, create: { usuarioId, provaId: EXAM_IDS[nivel], acertos: result.totalAcertos, totalQuestoes: result.totalQuestoes }, update: { acertos: result.totalAcertos, totalQuestoes: result.totalQuestoes } });
            const aprovado = passed(result);
            return { tentativaId: attempt.id, provaId: EXAM_IDS[nivel], concluido: true, nivel, nota: result.nota, totalAcertos: result.totalAcertos, totalQuestoes: result.totalQuestoes, aprovado, notaMinima: PASS_MARK, proximaTentativaEm: aprovado ? null : new Date(now.getTime() + 86400000).toISOString(),
                feedback: questions.map(question => ({ questaoId: question.id, enunciado: question.enunciado, explicacao: clearLessonTag(question.explicacao), correta: result.respostas.find(answer => answer.questaoId === question.id)!.acertou, respostaCorreta: question.alternativas.find(answer => answer.isCorreta)?.texto ?? '' })) };
        });
    }
}
