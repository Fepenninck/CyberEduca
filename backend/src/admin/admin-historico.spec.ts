import { describe, expect, it, jest } from '@jest/globals';
import { BadRequestException, ExecutionContext } from '@nestjs/common';
import { AcaoAuditoria } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { defer, lastValueFrom, of, throwError } from 'rxjs';
import { AuditoriaContexto } from '../auditoria-contexto';
import { AuditoriaService } from '../auditoria.service';
import { AuditoriaInterceptor } from '../auditoria.interceptor';
import { AdminHistoricoService } from './admin-historico.service';
import { ListarHistoricoDto } from './dto/listar-historico.dto';
import {
  CriarAulaAdminDto,
  AtualizarAulaAdminDto,
} from './dto/criar-aula-admin.dto';
import { PrismaService } from '../prisma.service';

function preparar() {
  const create = jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue({ id: 'log' });
  const prisma = {
    logAuditoria: {
      create,
      findMany: jest
        .fn<(...args: any[]) => Promise<any>>()
        .mockResolvedValue([
          {
            id: 'log',
            acao: 'LOGIN',
            detalhes: {
              senha: 'segredo',
              token: 'token',
              metodo: 'POST',
              rota: '/auth/login',
            },
          },
        ]),
      count: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(51),
    },
    $transaction: jest
      .fn<(...args: any[]) => Promise<any>>()
      .mockImplementation((queries: Promise<unknown>[]) =>
        Promise.all(queries),
      ),
  };
  const contexto = new AuditoriaContexto();
  const auditoria = new AuditoriaService(
    prisma as unknown as PrismaService,
    contexto,
  );
  const interceptor = new AuditoriaInterceptor(contexto, auditoria);
  const service = new AdminHistoricoService(prisma as unknown as PrismaService);
  const context = (id = 'admin', metodo = 'POST') =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id },
          method: metodo,
          path: '/admin/aulas',
          params: {},
          route: { path: '/admin/aulas' },
          body: { senha: 'nao-registrar' },
          get: () => 'agente',
        }),
      }),
    }) as unknown as ExecutionContext;
  return { prisma, create, auditoria, interceptor, service, context };
}
describe('Histórico, autoria e validação administrativa', () => {
  it('aplica filtros e paginação sem devolver payloads sensíveis', async () => {
    const { prisma, service } = preparar();
    const resultado = await service.listar(
      Object.assign(new ListarHistoricoDto(), {
        usuarioId: 'usuario',
        acao: 'LOGIN',
        resultado: 'falha',
        busca: 'Ana',
        pagina: 2,
      }),
    );
    expect(resultado.paginas).toBe(3);
    expect(resultado.registros[0]).toEqual({
      id: 'log',
      acao: 'LOGIN',
      metodo: 'POST',
      rota: '/auth/login',
    });
    const consulta = prisma.logAuditoria.findMany.mock.calls[0][0];
    expect(consulta).toMatchObject({
      take: 25,
      skip: 25,
      where: { atorId: 'usuario', acao: 'LOGIN', sucesso: false },
    });
    expect(consulta.select.dadosNovos).toBeUndefined();
    expect(consulta.select.dadosAnteriores).toBeUndefined();
    expect(consulta.select.ator.select.senhaHash).toBeUndefined();
  });
  it('rejeita período invertido antes de consultar o banco', async () => {
    const { prisma, service } = preparar();
    await expect(
      service.listar(
        Object.assign(new ListarHistoricoDto(), {
          inicio: '2026-11-20',
          fim: '2026-11-10',
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.logAuditoria.findMany).not.toHaveBeenCalled();
  });
  it('valida filtros de entrada, limites e usuário', async () => {
    const dto = plainToInstance(ListarHistoricoDto, {
      pagina: '0',
      limite: '1000',
      usuarioId: 'invalid',
      acao: 'INVENTADA',
      inicio: 'sem-data',
      resultado: 'qualquer',
    });
    expect((await validate(dto)).length).toBe(6);
    expect(
      await validate(
        plainToInstance(ListarHistoricoDto, {
          pagina: '2',
          limite: '25',
          acao: 'LOGIN',
        }),
      ),
    ).toEqual([]);
  });
  it('vincula autoria sem capturar o corpo da requisição', async () => {
    const { create, interceptor, context } = preparar();
    await expect(
      lastValueFrom(
        interceptor.intercept(context(), { handle: () => of({ id: 'aula' }) }),
      ),
    ).resolves.toEqual({ id: 'aula' });
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0].data).toMatchObject({
      atorId: 'admin',
      entidade: 'aulas',
      entidadeId: 'aula',
      acao: 'CRIAR',
      sucesso: true,
    });
    expect(JSON.stringify(create.mock.calls)).not.toContain('nao-registrar');
  });
  it('enriquece o registro existente sem duplicá-lo', async () => {
    const { create, auditoria, interceptor, context } = preparar();
    await lastValueFrom(
      interceptor.intercept(context(), {
        handle: () =>
          defer(async () => {
            await auditoria.registrar({
              acao: AcaoAuditoria.CRIAR,
              entidade: 'Prova',
            });
            return 'ok';
          }),
      }),
    );
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0].data.atorId).toBe('admin');
  });
  it('preserva o erro original sem gravar mensagem sensível', async () => {
    const { create, interceptor, context } = preparar();
    const erro = new Error('senha=segredo');
    await expect(
      lastValueFrom(
        interceptor.intercept(context(), {
          handle: () => throwError(() => erro),
        }),
      ),
    ).rejects.toBe(erro);
    expect(create.mock.calls[0][0].data.sucesso).toBe(false);
    expect(JSON.stringify(create.mock.calls)).not.toContain('segredo');
  });
  it('isola autores concorrentes e não cria eventos para consultas', async () => {
    const { create, interceptor, context } = preparar();
    await Promise.all(
      ['ana', 'bruno'].map((id) =>
        lastValueFrom(
          interceptor.intercept(context(id), {
            handle: () =>
              defer(async () => {
                await Promise.resolve();
                return { id };
              }),
          }),
        ),
      ),
    );
    expect(create.mock.calls.map(([arg]) => arg.data.atorId).sort()).toEqual([
      'ana',
      'bruno',
    ]);
    create.mockClear();
    await lastValueFrom(
      interceptor.intercept(context('admin', 'GET'), { handle: () => of([]) }),
    );
    expect(create).not.toHaveBeenCalled();
  });
  it('valida e normaliza a criação e edição de aulas', async () => {
    const dto = plainToInstance(CriarAulaAdminDto, {
      titulo: '  ',
      conteudo: ' ',
      ordem: 0,
      trilhaId: '',
    });
    expect((await validate(dto)).length).toBe(4);
    const valido = plainToInstance(CriarAulaAdminDto, {
      titulo: ' Aula ',
      conteudo: ' ## Objetivo\nTexto ',
      ordem: 2,
      trilhaId: 'trilha',
    });
    expect(await validate(valido)).toEqual([]);
    expect(valido.titulo).toBe('Aula');
    expect(valido.conteudo).toBe('## Objetivo\nTexto');
    expect(
      (
        await validate(
          plainToInstance(AtualizarAulaAdminDto, { conteudo: ' ', ordem: -1 }),
        )
      ).length,
    ).toBe(2);
  });
});
