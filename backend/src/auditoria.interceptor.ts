import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { AcaoAuditoria } from '@prisma/client';
import type { Request } from 'express';
import { Observable, catchError, concatMap } from 'rxjs';
import { AuditoriaContexto } from './auditoria-contexto';
import { AuditoriaService } from './auditoria.service';

@Injectable()
export class AuditoriaInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditoriaInterceptor.name);
  constructor(
    private readonly contexto: AuditoriaContexto,
    private readonly auditoria: AuditoriaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: { id: string } }>();
    if (
      !req.user?.id ||
      !['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)
    )
      return next.handle();
    const estado = {
      atorId: req.user.id,
      ip: req.ip,
      userAgent: req.get('user-agent')?.slice(0, 500),
      registrados: 0,
    };
    const registrar = async (sucesso: boolean, value?: unknown) => {
      if (estado.registrados) return;
      // The account and its audit records were removed in the same transaction.
      if (sucesso && req.method === 'DELETE' && req.path === '/usuarios/me') return;
      const contaExcluida = sucesso && req.method === 'DELETE' && /^\/admin\/usuarios\/[^/]+$/.test(req.path);
      const partes = req.path.split('/').filter(Boolean);
      const entidade = partes[0] === 'admin' ? partes[1] : partes[0];
      const dados = value as { id?: unknown } | undefined;
      const id =
        Object.entries(req.params ?? {}).find(([key]) =>
          /id$/i.test(key),
        )?.[1] ?? (typeof dados?.id === 'string' ? dados.id : undefined);
      try {
        await this.auditoria.registrar({
          acao:
            req.method === 'DELETE'
              ? AcaoAuditoria.EXCLUIR
              : req.method === 'POST'
                ? AcaoAuditoria.CRIAR
                : AcaoAuditoria.ATUALIZAR,
          entidade: entidade || 'Operação',
          entidadeId: !contaExcluida && typeof id === 'string' ? id : undefined,
          sucesso,
          detalhes: {
            metodo: req.method,
            rota: typeof req.route?.path === 'string' ? req.route.path : '',
          },
          // Request bodies and exception messages may contain credentials or personal data.
          erro: sucesso ? undefined : 'A operação não foi concluída.',
        });
      } catch {
        this.logger.warn(
          'Não foi possível persistir o registro de auditoria da operação.',
        );
      }
    };
    return new Observable((subscriber) =>
      this.contexto.storage.run(estado, () =>
        next
          .handle()
          .pipe(
            concatMap(async (value) => {
              await registrar(true, value);
              return value;
            }),
            catchError(
              (error) =>
                new Observable<never>((observer) => {
                  void registrar(false).finally(() => observer.error(error));
                }),
            ),
          )
          .subscribe(subscriber),
      ),
    );
  }
}
