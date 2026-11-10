import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { VirusTotalService } from './virustotal.service';

describe('VirusTotalService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.VIRUSTOTAL_API_KEY;
  });

  it('mapeia estatísticas retornadas pelo provedor', async () => {
    process.env.VIRUSTOTAL_API_KEY = 'chave-teste';
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        data: { attributes: { last_analysis_stats: {
          malicious: 1, suspicious: 2, harmless: 3, undetected: 4, timeout: 0,
        } } },
      }), { status: 200, headers: { 'content-type': 'application/json' } }),
    );

    await expect(new VirusTotalService().obterRelatorioVirusTotal('example.com')).resolves.toEqual({
      malicious: 1, suspicious: 2, harmless: 3, undetected: 4, timeout: 0,
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/domains/example.com'),
      expect.objectContaining({ method: 'GET', headers: expect.objectContaining({ 'x-apikey': 'chave-teste' }) }),
    );
  });
});
