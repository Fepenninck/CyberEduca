import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { VirusTotalService } from './virustotal.service';

describe('VirusTotal: falhas do provedor e sigilo da chave', () => {
  const service = new VirusTotalService();
  const chaveAnterior = process.env.VIRUSTOTAL_API_KEY;
  beforeEach(() => {
    process.env.VIRUSTOTAL_API_KEY = 'chave-exclusiva-do-teste';
  });
  afterEach(() => {
    jest.restoreAllMocks();
    if (chaveAnterior === undefined) delete process.env.VIRUSTOTAL_API_KEY;
    else process.env.VIRUSTOTAL_API_KEY = chaveAnterior;
  });
  it('envia a chave somente ao provedor e retorna somente estatísticas', async () => {
    const mock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              attributes: {
                last_analysis_stats: {
                  malicious: 0,
                  suspicious: 1,
                  harmless: 2,
                  undetected: 3,
                  timeout: 0,
                },
              },
            },
          }),
        ),
      );
    expect(await service.obterRelatorioVirusTotal('exemplo.com')).toEqual({
      malicious: 0,
      suspicious: 1,
      harmless: 2,
      undetected: 3,
      timeout: 0,
    });
    expect(mock).toHaveBeenCalledWith(
      'https://www.virustotal.com/api/v3/domains/exemplo.com',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-apikey': 'chave-exclusiva-do-teste',
        }),
      }),
    );
  });
  it('retorna ausência de dados para domínio sem relatório', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 404 }));
    expect(await service.obterRelatorioVirusTotal('exemplo.com')).toBeNull();
  });
  it.each([429, 401, 500])(
    'trata resposta HTTP %s sem expor a chave',
    async (status) => {
      jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(new Response(null, { status }));
      try {
        await service.obterRelatorioVirusTotal('exemplo.com');
        throw new Error('A consulta deveria falhar');
      } catch (e) {
        expect((e as { getStatus(): number }).getStatus()).toBe(
          status === 401 ? 503 : status === 500 ? 502 : 429,
        );
        expect(String(e)).not.toContain('chave-exclusiva-do-teste');
      }
    },
  );
  it('trata falha de rede', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('Falha de rede'));
    await expect(
      service.obterRelatorioVirusTotal('exemplo.com'),
    ).rejects.toMatchObject({ status: 502 });
  });
  it('recusa estatísticas inválidas', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            data: { attributes: { last_analysis_stats: { malicious: -1 } } },
          }),
        ),
      );
    await expect(
      service.obterRelatorioVirusTotal('exemplo.com'),
    ).rejects.toMatchObject({ status: 502 });
  });
});
