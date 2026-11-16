const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const modules = new Map()
let ready = 0
let probes = 0
function load(name) {
  if (modules.has(name)) return modules.get(name)
  const source = fs.readFileSync(path.resolve(__dirname, '../lib', name + '.ts'), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const module = { exports: {} }
  const importer = dependency => {
    if (dependency === './loading-state') return { beginLoading: () => () => {} }
    if (dependency === './backend-ready') return { waitForBackend: async () => { probes++ }, markBackendReady: () => { ready++ } }
    return load(dependency.replace('./', ''))
  }
  new Function('require', 'module', 'exports', compiled)(importer, module, module.exports)
  modules.set(name, module.exports)
  return module.exports
}
const tick = () => new Promise(resolve => setImmediate(resolve))
async function main() {
  global.window = { dispatchEvent() {} }
  const { apiFetch, clearCurrentUser } = load('api')
  let calls = 0
  let finish
  global.fetch = (_url, options) => {
    calls++
    assert.equal(options.credentials, 'include')
    return new Promise(resolve => { finish = resolve })
  }
  const first = apiFetch('/usuarios/me/conquistas', { cache: 'no-store' })
  const second = apiFetch('/usuarios/me/conquistas', { cache: 'no-store' })
  await tick()
  assert.equal(calls, 1, 'Simultaneous achievement readers share one network request.')
  finish(Response.json({ conquered: true }))
  const [a, b] = await Promise.all([first, second])
  assert.deepEqual(await a.json(), await b.json(), 'Each consumer can read its own body.')
  assert.equal(ready, 1)

  global.fetch = async () => { calls++; return Response.json({ updated: true }) }
  assert.deepEqual(await (await apiFetch('/usuarios/me/conquistas', { cache: 'no-store' })).json(), { updated: true })
  assert.equal(calls, 2, 'Later visits fetch fresh data, including no-store.')

  const cancelled = new AbortController()
  global.fetch = () => { calls++; return new Promise(resolve => { finish = resolve }) }
  const aborted = apiFetch('/trilhas', { signal: cancelled.signal })
  const surviving = apiFetch('/trilhas')
  await tick()
  const reason = new Error('Navigation changed')
  cancelled.abort(reason)
  await assert.rejects(aborted, error => error === reason)
  finish(Response.json({ alive: true }))
  assert.deepEqual(await (await surviving).json(), { alive: true }, 'Unmounting one reader leaves other readers working.')
  const beforeAborted = calls
  await assert.rejects(apiFetch('/trilhas', { signal: cancelled.signal }), error => error === reason)
  assert.equal(calls, beforeAborted, 'An already cancelled request does not reach the network.')

  let oldFinish
  global.fetch = () => { calls++; return new Promise(resolve => { oldFinish = resolve }) }
  const oldRead = apiFetch('/admin/usuarios')
  await tick()
  global.fetch = async () => { calls++; return Response.json({ fresh: true }) }
  await apiFetch('/admin/usuarios/id', { method: 'PATCH' })
  assert.deepEqual(await (await apiFetch('/admin/usuarios')).json(), { fresh: true }, 'Writes invalidate shared reads before refresh.')
  oldFinish(Response.json({ old: true }))
  await oldRead

  global.fetch = () => new Promise(resolve => { oldFinish = resolve })
  const previousSession = apiFetch('/usuarios/me')
  await tick()
  clearCurrentUser()
  global.fetch = async () => Response.json({ account: 'new' })
  assert.deepEqual(await (await apiFetch('/usuarios/me')).json(), { account: 'new' }, 'New sessions never share the previous session request.')
  oldFinish(Response.json({ account: 'previous' }))
  await previousSession

  global.fetch = async () => { throw new Error('offline') }
  await assert.rejects(apiFetch('/retry'), /offline/)
  global.fetch = async () => Response.json({ recovered: true })
  assert.equal((await apiFetch('/retry')).status, 200, 'Failed reads are not retained.')

  calls = 0
  global.fetch = async () => { calls++; return Response.json({}) }
  await Promise.all([apiFetch('/admin/usuarios', { headers: { Accept: 'application/json' } }), apiFetch('/admin/usuarios', { headers: { Accept: 'text/plain' } })])
  assert.equal(calls, 2, 'Custom options are never combined.')
  calls = 0
  await Promise.all([apiFetch('/trilhas', { cache: 'no-store' }), apiFetch('/trilhas', { cache: 'reload' })])
  assert.equal(calls, 2, 'Different cache semantics remain separate.')
  calls = 0
  await Promise.all([apiFetch('/admin/usuarios/id', { method: 'PATCH' }), apiFetch('/admin/usuarios/id', { method: 'PATCH' })])
  assert.equal(calls, 2, 'Writes are never combined.')

  global.fetch = async () => Response.json({}, { status: 503 })
  const readyBefore = ready
  await apiFetch('/unavailable')
  assert.equal(ready, readyBefore, 'An unavailable backend is not marked ready.')
  await apiFetch('/auth/login', { method: 'POST' })
  assert.equal(probes, 1, 'Login readiness protection is preserved.')

  const backendSource = fs.readFileSync(path.resolve(__dirname, '../lib/backend-ready.ts'), 'utf8')
  const backendCompiled = ts.transpileModule(backendSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const backendModule = { exports: {} }
  new Function('require', 'module', 'exports', backendCompiled)(() => ({ beginLoading: () => () => {} }), backendModule, backendModule.exports)
  calls = 0
  global.fetch = async () => { calls++; return Response.json({}, { status: 401 }) }
  await backendModule.exports.waitForBackend()
  assert.equal(calls, 1, 'An unknown backend is probed, including signed-out responses.')
  backendModule.exports.markBackendReady()
  await backendModule.exports.waitForBackend()
  assert.equal(calls, 1, 'A recent JSON response avoids a redundant availability probe.')

  delete global.window
  calls = 0
  global.fetch = async () => { calls++; return Response.json({}) }
  await Promise.all([apiFetch('/usuarios/me'), apiFetch('/usuarios/me')])
  assert.equal(calls, 2, 'Server-side requests are never shared between visitors.')
  console.log('OK: concurrent reads, independent bodies and cancellation, fresh reads, mutations, account isolation, retries, custom options and backend readiness.')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
