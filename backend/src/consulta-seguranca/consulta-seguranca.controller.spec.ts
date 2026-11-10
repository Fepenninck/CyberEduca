import { describe, expect, it, jest } from '@jest/globals';

jest.unstable_mockModule('./consulta-seguranca.service', () => ({
  ConsultaSegurancaService: class ConsultaSegurancaService {},
}));

const { ConsultaSegurancaController } = await import('./consulta-seguranca.controller');
type ConsultaSegurancaService = import('./consulta-seguranca.service').ConsultaSegurancaService;

describe('ConsultaSegurancaController', () => {
  it('encaminha o domínio e o usuário autenticado ao service', () => {
    const service = { consultarDominio: jest.fn().mockReturnValue({ resultado: 'SEGURO' }) };
    const controller = new ConsultaSegurancaController(service as unknown as ConsultaSegurancaService);

    expect(controller.consultar({ user: { id: 'u1' } } as any, { dominio: 'example.com' } as any))
      .toEqual({ resultado: 'SEGURO' });
    expect(service.consultarDominio).toHaveBeenCalledWith('u1', 'example.com');
  });
});
