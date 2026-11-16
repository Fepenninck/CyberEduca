import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export type ContextoAuditoria = {
  atorId: string;
  ip?: string;
  userAgent?: string;
  registrados: number;
};

@Injectable()
export class AuditoriaContexto {
  readonly storage = new AsyncLocalStorage<ContextoAuditoria>();
}
