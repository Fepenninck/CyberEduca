import 'reflect-metadata';
import { describe, expect, it } from '@jest/globals';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AulasController, TrilhasController } from './aprendizagem.controller';

describe('Permissoes das rotas antigas', () => {
  for (const controller of [AulasController, TrilhasController]) {
    it(`exige JWT e ADMIN para criar e editar em ${controller.name}`, () => {
      expect(Reflect.getMetadata(GUARDS_METADATA, controller)).toContain(JwtAuthGuard);
      for (const method of ['criar', 'editar'] as const) {
        expect(Reflect.getMetadata(GUARDS_METADATA, controller.prototype[method])).toContain(AdminGuard);
      }
    });
  }
  it('permite ao aluno concluir uma aula', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, AulasController.prototype.concluir) ?? []).not.toContain(AdminGuard);
  });
});
