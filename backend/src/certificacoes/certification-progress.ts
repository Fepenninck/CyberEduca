import type { PrismaService } from '../prisma.service';

export const LEVELS = ['BASICO', 'INTERMEDIARIO', 'AVANCADO'] as const;
export type Level = typeof LEVELS[number];
export const PASS_MARK = 6;
export const RETRY_DELAY = 24 * 60 * 60 * 1000;
export const RETIRED_TRACK = '4328594b-f7cb-52d2-862f-e612b1647aa9';
export const EXAM_IDS: Record<Level, string> = {
    BASICO: 'ce000000-0000-4000-9001-000000000001',
    INTERMEDIARIO: 'ce000000-0000-4000-9001-000000000002',
    AVANCADO: 'ce000000-0000-4000-9001-000000000003',
};
export const isCertificationExam = (id: string) => Object.values(EXAM_IDS).includes(id);
export const questionLesson = (explanation: string) => explanation.match(/^\[aula:([a-zA-Z0-9-]+)\]/)?.[1];
export const clearLessonTag = (explanation: string) => explanation.replace(/^\[aula:[a-zA-Z0-9-]+\]\s*/, '');
export const passed = (attempt: { totalAcertos: number; totalQuestoes: number }) => attempt.totalQuestoes > 0 && attempt.totalAcertos * 10 >= attempt.totalQuestoes * PASS_MARK;
type Db = Pick<PrismaService, 'aula' | 'prova' | 'tentativaProva'>;

export async function loadCertificationProgress(db: Db, usuarioId: string, now = new Date()) {
    const [lessons, exams, attempts] = await Promise.all([
        db.aula.findMany({
            where: { trilhaId: { not: RETIRED_TRACK } },
            orderBy: [{ trilha: { ordem: 'asc' } }, { ordem: 'asc' }],
            select: { id: true, trilha: { select: { nivel: true } }, progressos: { where: { usuarioId, concluida: true }, select: { dataConclusao: true } } },
        }),
        db.prova.findMany({ where: { id: { in: Object.values(EXAM_IDS) }, status: 'PUBLICADO' }, select: { id: true, questoes: { select: { id: true, explicacao: true, _count: { select: { alternativas: true } } } } } }),
        db.tentativaProva.findMany({ where: { usuarioId, provaId: { in: Object.values(EXAM_IDS) }, concluidoEm: { not: null } }, orderBy: { concluidoEm: 'asc' }, select: { id: true, provaId: true, nota: true, totalAcertos: true, totalQuestoes: true, concluidoEm: true } }),
    ]);
    let previousPassed = true;
    return LEVELS.map(nivel => {
        const aulas = lessons.filter(lesson => lesson.trilha.nivel === nivel);
        const exam = exams.find(item => item.id === EXAM_IDS[nivel]);
        const history = attempts.filter(item => item.provaId === EXAM_IDS[nivel]);
        const approval = history.find(passed);
        const last = history.at(-1);
        const aulasConcluidas = aulas.filter(lesson => lesson.progressos.length > 0).length;
        const aulasCompletas = aulas.length > 0 && aulasConcluidas === aulas.length;
        const bancoPronto = Boolean(exam) && aulas.length > 0 && aulas.every(lesson => exam!.questoes.filter(question => questionLesson(question.explicacao) === lesson.id && question._count.alternativas >= 2).length >= 2);
        const aprovado = previousPassed && aulasCompletas && Boolean(approval);
        const proximaTentativaEm = !aprovado && last?.concluidoEm ? new Date(last.concluidoEm.getTime() + RETRY_DELAY).toISOString() : null;
        const aguardando = Boolean(proximaTentativaEm && new Date(proximaTentativaEm) > now);
        const motivo = aprovado ? 'APROVADO' : !previousPassed ? 'NIVEL_ANTERIOR' : !aulasCompletas ? 'AULAS_PENDENTES' : !bancoPronto ? 'BANCO_INCOMPLETO' : aguardando ? 'AGUARDE' : null;
        const state = {
            nivel, provaId: EXAM_IDS[nivel], totalAulas: aulas.length, aulasConcluidas, aulasCompletas,
            desbloqueado: previousPassed, aprovado, conquistada: aprovado,
            conquistadaEm: aprovado ? approval!.concluidoEm!.toISOString() : null,
            notaMinima: PASS_MARK, totalQuestoes: aulas.length, bancoPronto,
            podeIniciar: motivo === null, motivo, proximaTentativaEm,
            ultimaTentativa: last ? { id: last.id, nota: last.nota, totalAcertos: last.totalAcertos, totalQuestoes: last.totalQuestoes, concluidoEm: last.concluidoEm!.toISOString() } : null,
        };
        previousPassed = aprovado;
        return state;
    });
}
