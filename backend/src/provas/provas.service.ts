import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AcaoAuditoria, StatusProva } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { AuditoriaService } from '../auditoria.service';
import { AvaliacoesService } from '../avaliacoes/avaliacoes.service';
import { CriarProvaDto } from './dto/criar-prova.dto';
import { AtualizarProvaDto } from './dto/atualizar-prova.dto';
import { CriarQuestaoProvaDto } from './dto/criar-questao-prova.dto';
import { CriarAlternativaProvaDto } from './dto/criar-alternativa-prova.dto';
import { EnviarTentativaProvaDto } from './dto/enviar-tentativa-prova.dto';

type AlternativaPublica = {
  id: string;
  texto: string;
  ordem: number;
};

type QuestaoPublica = {
  id: string;
  enunciado: string;
  ordem: number;
  alternativas: AlternativaPublica[];
};

@Injectable()
export class ProvasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly avaliacoes: AvaliacoesService,
  ) {}

  // ---------- Administracao ----------

  async criarProva(dados: CriarProvaDto, atorId: string) {
    const trilha = await this.prisma.trilha.findUnique({
      where: { id: dados.trilhaId },
    });

    if (!trilha) {
      throw new NotFoundException('Trilha nao encontrada.');
    }

    const prova = await this.prisma.prova.create({
      data: {
        titulo: dados.titulo,
        descricao: dados.descricao ?? '',
        trilhaId: dados.trilhaId,
      },
    });

    await this.auditoria.registrar({
      acao: AcaoAuditoria.CRIAR,
      entidade: 'Prova',
      entidadeId: prova.id,
      atorId,
      dadosNovos: { titulo: prova.titulo, trilhaId: prova.trilhaId },
    });

    return prova;
  }

  async atualizarProva(
    provaId: string,
    dados: AtualizarProvaDto,
    atorId: string,
  ) {
    const anterior = await this.prisma.prova.findUnique({
      where: { id: provaId },
    });

    if (!anterior) {
      throw new NotFoundException('Prova nao encontrada.');
    }

    const prova = await this.prisma.prova.update({
      where: { id: provaId },
      data: dados,
    });

    await this.auditoria.registrar({
      acao: AcaoAuditoria.ATUALIZAR,
      entidade: 'Prova',
      entidadeId: provaId,
      atorId,
      dadosAnteriores: { titulo: anterior.titulo, status: anterior.status },
      dadosNovos: { titulo: prova.titulo, status: prova.status },
    });

    return prova;
  }

  async listarProvasAdmin() {
    const provas = await this.prisma.prova.findMany({
      orderBy: { criadoEm: 'desc' },
      include: {
        trilha: { select: { id: true, titulo: true } },
        _count: { select: { questoes: true, tentativas: true } },
      },
    });

    return provas.map(
      (p: {
        id: string;
        titulo: string;
        descricao: string;
        status: StatusProva;
        criadoEm: Date;
        trilha: { id: string; titulo: string };
        _count: { questoes: number; tentativas: number };
      }) => ({
        id: p.id,
        titulo: p.titulo,
        descricao: p.descricao,
        status: p.status,
        criadoEm: p.criadoEm,
        trilha: p.trilha,
        totalQuestoes: p._count.questoes,
        totalTentativas: p._count.tentativas,
      }),
    );
  }

  async criarQuestao(
    provaId: string,
    dados: CriarQuestaoProvaDto,
    atorId: string,
  ) {
    await this.garantirProvaExiste(provaId);

    const ordemOcupada = await this.prisma.questaoProva.findFirst({
      where: { provaId, ordem: dados.ordem },
      select: { id: true },
    });

    if (ordemOcupada) {
      throw new BadRequestException(
        `Ja existe uma questao na ordem ${dados.ordem} nesta prova.`,
      );
    }

    const questao = await this.prisma.questaoProva.create({
      data: { provaId, enunciado: dados.enunciado, ordem: dados.ordem },
    });

    await this.auditoria.registrar({
      acao: AcaoAuditoria.CRIAR,
      entidade: 'QuestaoProva',
      entidadeId: questao.id,
      atorId,
      dadosNovos: { provaId, ordem: questao.ordem },
    });

    return questao;
  }

  async criarAlternativa(
    provaId: string,
    questaoId: string,
    dados: CriarAlternativaProvaDto,
    atorId: string,
  ) {
    const questao = await this.prisma.questaoProva.findUnique({
      where: { id: questaoId },
      include: { alternativas: { select: { id: true, correta: true, ordem: true } } },
    });

    if (!questao || questao.provaId !== provaId) {
      throw new NotFoundException('Questao nao encontrada nesta prova.');
    }

    if (questao.alternativas.some((a: { ordem: number }) => a.ordem === dados.ordem)) {
      throw new BadRequestException(
        `Ja existe uma alternativa na ordem ${dados.ordem} nesta questao.`,
      );
    }

    const jaTemCorreta = questao.alternativas.some(
      (a: { correta: boolean }) => a.correta,
    );

    if (dados.correta && jaTemCorreta) {
      throw new BadRequestException(
        'Esta questao ja possui uma alternativa correta.',
      );
    }

    const alternativa = await this.prisma.alternativaProva.create({
      data: {
        questaoId,
        texto: dados.texto,
        correta: dados.correta ?? false,
        ordem: dados.ordem,
      },
    });

    await this.auditoria.registrar({
      acao: AcaoAuditoria.CRIAR,
      entidade: 'AlternativaProva',
      entidadeId: alternativa.id,
      atorId,
      dadosNovos: { questaoId, ordem: alternativa.ordem },
    });

    return alternativa;
  }

  // Publicar exige que toda questao tenha ao menos duas alternativas e uma correta.
  async publicarProva(provaId: string, atorId: string) {
    const prova = await this.prisma.prova.findUnique({
      where: { id: provaId },
      include: {
        questoes: {
          include: { alternativas: { select: { correta: true } } },
        },
      },
    });

    if (!prova) {
      throw new NotFoundException('Prova nao encontrada.');
    }

    if (prova.questoes.length === 0) {
      throw new BadRequestException(
        'Adicione pelo menos uma questao antes de publicar.',
      );
    }

    const invalida = prova.questoes.find(
      (q: { alternativas: { correta: boolean }[] }) =>
        q.alternativas.length < 2 ||
        !q.alternativas.some((a: { correta: boolean }) => a.correta),
    );

    if (invalida) {
      throw new BadRequestException(
        'Cada questao precisa de pelo menos duas alternativas e uma correta.',
      );
    }

    return this.alterarStatus(provaId, StatusProva.PUBLICADA, atorId);
  }

  async arquivarProva(provaId: string, atorId: string) {
    await this.garantirProvaExiste(provaId);
    return this.alterarStatus(provaId, StatusProva.ARQUIVADA, atorId);
  }

  async alterarStatus(
    provaId: string,
    status: StatusProva,
    atorId: string,
  ) {
    const prova = await this.prisma.prova.update({
      where: { id: provaId },
      data: { status },
    });

    await this.auditoria.registrar({
      acao: AcaoAuditoria.ATUALIZAR,
      entidade: 'Prova',
      entidadeId: provaId,
      atorId,
      dadosNovos: { status },
    });

    return prova;
  }

  // ---------- Consulta do aluno ----------

  async listarProvas(trilhaId?: string) {
    const provas = await this.prisma.prova.findMany({
      where: {
        status: StatusProva.PUBLICADA,
        ...(trilhaId ? { trilhaId } : {}),
      },
      orderBy: { criadoEm: 'desc' },
      include: {
        trilha: { select: { id: true, titulo: true, nivel: true } },
        _count: { select: { questoes: true } },
      },
    });

    return provas.map(
      (p: {
        id: string;
        titulo: string;
        descricao: string;
        trilha: { id: string; titulo: string; nivel: string };
        _count: { questoes: number };
      }) => ({
        id: p.id,
        titulo: p.titulo,
        descricao: p.descricao,
        trilha: p.trilha,
        totalQuestoes: p._count.questoes,
      }),
    );
  }

  // Nunca retorna o campo "correta": o gabarito so existe no backend.
  async buscarProva(provaId: string) {
    const prova = await this.prisma.prova.findUnique({
      where: { id: provaId },
      include: {
        trilha: { select: { id: true, titulo: true, nivel: true } },
        questoes: {
          orderBy: { ordem: 'asc' },
          include: {
            alternativas: {
              orderBy: { ordem: 'asc' },
              select: { id: true, texto: true, ordem: true },
            },
          },
        },
      },
    });

    if (!prova) {
      throw new NotFoundException('Prova nao encontrada.');
    }

    if (prova.status !== StatusProva.PUBLICADA) {
      throw new ForbiddenException('Esta prova nao esta disponivel.');
    }

    return {
      id: prova.id,
      titulo: prova.titulo,
      descricao: prova.descricao,
      trilha: prova.trilha,
      totalQuestoes: prova.questoes.length,
      questoes: prova.questoes.map(
        (q: QuestaoPublica): QuestaoPublica => ({
          id: q.id,
          enunciado: q.enunciado,
          ordem: q.ordem,
          alternativas: q.alternativas,
        }),
      ),
    };
  }

  // ---------- Envio da tentativa (Funcionalidade 2) ----------

  async enviarTentativa(
    provaId: string,
    usuarioId: string,
    dados: EnviarTentativaProvaDto,
  ) {
    const prova = await this.prisma.prova.findUnique({
      where: { id: provaId },
      select: { id: true, status: true },
    });

    if (!prova) {
      throw new NotFoundException('Prova nao encontrada.');
    }

    if (prova.status !== StatusProva.PUBLICADA) {
      throw new ForbiddenException('Esta prova nao esta disponivel.');
    }

    const resultado = await this.avaliacoes.salvarTentativaProva(
      usuarioId,
      provaId,
      dados.respostas,
    );

    await this.auditoria.registrar({
      acao: AcaoAuditoria.CRIAR,
      entidade: 'TentativaProva',
      entidadeId: resultado.tentativaId,
      atorId: usuarioId,
      dadosNovos: {
        provaId,
        nota: resultado.nota,
        totalAcertos: resultado.totalAcertos,
      },
    });

    return resultado;
  }

  private async garantirProvaExiste(provaId: string) {
    const prova = await this.prisma.prova.findUnique({
      where: { id: provaId },
      select: { id: true },
    });

    if (!prova) {
      throw new NotFoundException('Prova nao encontrada.');
    }

    return prova;
  }
}
