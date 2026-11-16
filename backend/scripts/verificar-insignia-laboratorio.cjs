require('dotenv').config({ quiet: true });
require('ts-node').register({ transpileOnly: true, compilerOptions: { rootDir: '.' } });
require('reflect-metadata');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { PrismaService } = require('../src/prisma.service');
const { UsuariosService } = require('../src/usuarios/usuarios.service');
const { ConsultaSegurancaService } = require('../src/consulta-seguranca/consulta-seguranca.service');
const prisma = new PrismaService(), usuarioId = randomUUID(), outroId = randomUUID();
const rollback = new Error('VERIFICACAO_REVERTIDA');
(async () => {
  try {
    try {
      await prisma.$transaction(async tx => {
        await tx.usuario.createMany({ data: [usuarioId, outroId].map(id => ({ id, nome: 'Verificação temporária do laboratório', email: `${id}@example.invalid` })) });
        const usuarios = new UsuariosService(tx);
        const falha = new ConsultaSegurancaService(tx, { obterRelatorioVirusTotal: async () => { throw new Error('FALHA_SIMULADA'); } });
        assert.equal((await usuarios.conquistaLaboratorio(usuarioId)).conquistada, false);
        await assert.rejects(() => falha.consultarDominio(usuarioId, 'https://example.com'));
        await assert.rejects(() => falha.consultarDominio(usuarioId, 'example.com'), /FALHA_SIMULADA/);
        assert.equal((await usuarios.conquistaLaboratorio(usuarioId)).conquistada, false);
        // Provedor substituído apenas neste teste; nenhum domínio é enviado a um serviço externo.
        const laboratorio = new ConsultaSegurancaService(tx, { obterRelatorioVirusTotal: async () => null });
        const consulta = await laboratorio.consultarDominio(usuarioId, 'example.com');
        const primeira = await usuarios.conquistaLaboratorio(usuarioId);
        assert.equal(consulta.resultado, 'SEM_DADOS');
        assert.equal(primeira.conquistada, true);
        assert.equal(primeira.conquistadaEm, consulta.consultadoEm.toISOString());
        assert.equal(await tx.consultaSeguranca.count({ where: { usuarioId } }), 1);
        assert.equal((await usuarios.conquistaLaboratorio(outroId)).conquistada, false);
        await tx.consultaSeguranca.create({ data: { usuarioId, dominio: 'example.org', resultado: 'MALICIOSO', consultadoEm: new Date(consulta.consultadoEm.getTime() + 1000) } });
        assert.deepEqual(await usuarios.conquistaLaboratorio(usuarioId), primeira);
        throw rollback;
      }, { timeout: 30000 });
    } catch (error) { if (error !== rollback) throw error; }
    assert.equal(await prisma.usuario.count({ where: { id: { in: [usuarioId, outroId] } } }), 0);
    assert.equal(await prisma.consultaSeguranca.count({ where: { usuarioId } }), 0);
    console.log('Laboratório: primeira consulta libera a insígnia, falhas não liberam, usuários são isolados e a data inicial é preservada. Dados de teste revertidos; nenhuma consulta externa.');
  } finally { await prisma.$disconnect(); }
})().catch(error => { console.error(error instanceof assert.AssertionError ? error.message : 'Falha na verificação do laboratório. A transação de teste foi revertida.'); process.exitCode = 1; });
