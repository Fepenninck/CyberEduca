import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';

jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: class PrismaClient {},
  ResultadoConsultaSeguranca: {
    SEM_DADOS: 'SEM_DADOS',
    MALICIOSO: 'MALICIOSO',
    SUSPEITO: 'SUSPEITO',
    SEM_DETECCOES: 'SEM_DETECCOES',
  },
}));

const { ConsultaSegurancaService } = await import('./consulta-seguranca.service');
const ResultadoConsultaSeguranca = {
  SEM_DADOS: 'SEM_DADOS',
  MALICIOSO: 'MALICIOSO',
  SUSPEITO: 'SUSPEITO',
  SEM_DETECCOES: 'SEM_DETECCOES',
};
type PrismaService = import('../prisma.service').PrismaService;
type ConsultaSegurancaServiceType = import('./consulta-seguranca.service').ConsultaSegurancaService;
type VirusTotalServiceType = import('./virustotal.service').VirusTotalService;

describe('ConsultaSegurancaService', () => {
  const prismaMock = {
    consultaSeguranca: { create: jest.fn<(...args: any[]) => Promise<any>>() },
  };
  const virusTotalMock = {
    obterRelatorioVirusTotal: jest.fn<(...args: any[]) => Promise<any>>(),
  };
  let service: ConsultaSegurancaServiceType;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ConsultaSegurancaService(
      prismaMock as unknown as PrismaService,
      virusTotalMock as unknown as VirusTotalServiceType,
    );
  });

  it('normaliza domínio e classifica estatísticas do provedor', () => {
    expect(service.normalizarDominio('  EXAMPLE.COM. ')).toBe('example.com');
    expect(service.interpretarResultado({ malicious: 1, suspicious: 0, harmless: 0, undetected: 0, timeout: 0 }))
      .toBe(ResultadoConsultaSeguranca.MALICIOSO);
    expect(service.interpretarResultado(null)).toBe(ResultadoConsultaSeguranca.SEM_DADOS);
  });

  it('rejeita IP ou entrada com protocolo no campo de domínio', () => {
    expect(() => service.normalizarDominio('https://example.com')).toThrow(BadRequestException);
    expect(() => service.normalizarDominio('127.0.0.1')).toThrow(BadRequestException);
  });

  it('consulta o provedor e persiste o resultado usando mocks', async () => {
    virusTotalMock.obterRelatorioVirusTotal.mockResolvedValue({
      malicious: 0, suspicious: 0, harmless: 8, undetected: 2, timeout: 0,
    });
    prismaMock.consultaSeguranca.create.mockResolvedValue({
      dominio: 'example.com', resultado: ResultadoConsultaSeguranca.SEM_DETECCOES,
      consultadoEm: new Date('2026-01-01'),
    });

    await expect(service.consultarDominio('u1', 'EXAMPLE.COM')).resolves.toEqual({
      dominio: 'example.com',
      resultado: ResultadoConsultaSeguranca.SEM_DETECCOES,
      deteccoesMaliciosas: 0,
      deteccoesSuspeitas: 0,
      consultadoEm: new Date('2026-01-01'),
    });
    expect(virusTotalMock.obterRelatorioVirusTotal).toHaveBeenCalledWith('example.com');
    expect(prismaMock.consultaSeguranca.create).toHaveBeenCalled();
  });
});
