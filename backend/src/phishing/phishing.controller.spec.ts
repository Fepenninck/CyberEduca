import { describe, expect, it, jest } from '@jest/globals';

jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: class PrismaClient {},
  Prisma: { TransactionIsolationLevel: { Serializable: 'Serializable' } },
  TipoCenarioPhishing: { EMAIL: 'EMAIL' },
}));
jest.unstable_mockModule('./phishing.service', () => ({
  PhishingService: class PhishingService {},
}));

const { AdminPhishingController, PhishingController } = await import('./phishing.controller');
type PhishingService = import('./phishing.service').PhishingService;

describe('PhishingController', () => {
  it('encaminha consultas de aluno e operações administrativas', () => {
    const service = {
      listarCenarios: jest.fn().mockReturnValue([]), buscarCenario: jest.fn().mockReturnValue({ id: 'c1' }),
      responderCenario: jest.fn().mockReturnValue({ acertou: true }), listarCenariosAdmin: jest.fn().mockReturnValue([]),
      criarCenario: jest.fn().mockReturnValue({ id: 'c1' }), atualizarCenario: jest.fn().mockReturnValue({ id: 'c1' }),
      publicarCenario: jest.fn().mockReturnValue({ status: 'PUBLICADO' }), arquivarCenario: jest.fn().mockReturnValue({ status: 'ARQUIVADO' }),
    };
    const student = new PhishingController(service as unknown as PhishingService);
    const admin = new AdminPhishingController(service as unknown as PhishingService);
    const dto = {} as any;

    const req = { user: { id: 'u1' } } as any;
    student.listar(req, 'a1'); student.buscar(req, 'c1'); student.responder({ user: { id: 'u1' } } as any, 'c1', dto);
    admin.listar(); admin.criar(dto); admin.atualizar('c1', dto);
    admin.atualizarStatus('c1', { status: 'PUBLICADO' } as any);
    admin.atualizarStatus('c1', { status: 'ARQUIVADO' } as any);

    expect(service.listarCenarios).toHaveBeenCalledWith('a1', 'u1');
    expect(service.buscarCenario).toHaveBeenCalledWith('c1', 'u1');
    expect(service.responderCenario).toHaveBeenCalledWith('u1', 'c1', dto);
    expect(service.listarCenariosAdmin).toHaveBeenCalled();
    expect(service.criarCenario).toHaveBeenCalledWith(dto);
    expect(service.atualizarCenario).toHaveBeenCalledWith('c1', dto);
    expect(service.publicarCenario).toHaveBeenCalledWith('c1');
    expect(service.arquivarCenario).toHaveBeenCalledWith('c1');
  });
});
