const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const cache = new Map()
let started = 0
let ended = 0
let probes = 0
function load(name) {
  if (cache.has(name)) return cache.get(name)
  const source = fs.readFileSync(path.resolve(__dirname, '../lib', name + '.ts'), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const moduleObject = { exports: {} }
  const importer = dependency => {
    if (dependency === './loading-state') return { beginLoading: () => { started++; return () => { ended++ } } }
    if (dependency === './backend-ready') return { waitForBackend: async () => { probes++ } }
    return load(dependency.replace('./', ''))
  }
  new Function('require', 'module', 'exports', compiled)(importer, moduleObject, moduleObject.exports)
  cache.set(name, moduleObject.exports)
  return moduleObject.exports
}

async function main() {
  const originalFetch = global.fetch
  try {
    const { apiFetch } = load('api')
    const { fetchWithTimeout } = load('fetch-with-timeout')
    global.fetch = async (_url, options) => {
      assert.equal(options.credentials, 'include')
      return Response.json({ ok: true })
    }
    assert.equal((await apiFetch('/trilhas')).status, 200)
    assert.equal(started, 0, 'Leituras em segundo plano não podem bloquear a tela.')
    await apiFetch('/perfil', { method: 'PATCH' })
    assert.equal(started, 1)
    assert.equal(ended, 1)
    global.fetch = async () => { throw new Error('Rede indisponível') }
    await assert.rejects(apiFetch('/perfil', { method: 'PATCH' }), /Rede indisponível/)
    assert.equal(started, ended, 'Uma falha não pode deixar o carregamento preso.')
    global.fetch = (_url, options) => new Promise((_resolve, reject) => {
      if (options.signal.aborted) reject(options.signal.reason)
      else options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true })
    })
    await assert.rejects(fetchWithTimeout('/pendurada', undefined, 5), error => error.name === 'TimeoutError')
    const controller = new AbortController()
    const cancelled = fetchWithTimeout('/cancelada', { signal: controller.signal })
    const reason = new Error('Página mudou')
    controller.abort(reason)
    await assert.rejects(cancelled, error => error === reason)
    await assert.rejects(fetchWithTimeout('/já-cancelada', { signal: controller.signal }), error => error === reason)
    let calls = 0
    global.fetch = async () => ++calls === 1 ? new Response('<html>Iniciando</html>', { headers: { 'content-type': 'text/html' } }) : Response.json({ ok: true })
    assert.equal((await apiFetch('/trilhas')).status, 200)
    assert.equal(calls, 2)
    assert.equal(probes, 1)
    assert.equal(started, ended)
    console.log('Requisições: GET sem bloqueio global, escritas com indicador, falhas liberam carregamento, timeout e cancelamento funcionam, recuperação do backend preservada.')
  } finally { global.fetch = originalFetch }
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
