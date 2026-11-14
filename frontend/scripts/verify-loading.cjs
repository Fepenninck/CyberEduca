const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const assert = require('node:assert/strict')
const ts = require('typescript')
function load(name, globals = {}, imports = {}) {
  const exports = {}
  const file = path.join(__dirname, '..', name)
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  vm.runInNewContext(code, { exports, require: name => imports[name], setTimeout, clearTimeout, Date, Response, DOMException, AbortSignal, ...globals }, { filename: file })
  return exports
}
async function main() {
  let now = 0, id = 0
  const timers = new Map()
  const advance = duration => {
    now += duration
    for (const [key, timer] of [...timers]) if (timer.at <= now) { timers.delete(key); timer.fn() }
  }
  const state = load('lib/loading-state.ts', { window: {}, Date: { now: () => now }, setTimeout: (fn, ms) => { timers.set(++id, { fn, at: now + ms }); return id }, clearTimeout: key => timers.delete(key) })
  const end = state.beginLoading('One')
  end(); end()
  assert.equal(state.getLoadingSnapshot().visible, false)
  const slow = state.beginLoading()
  advance(199); assert.equal(state.getLoadingSnapshot().visible, false)
  advance(1); assert.equal(state.getLoadingSnapshot().visible, true)
  slow()
  advance(649); assert.equal(state.getLoadingSnapshot().visible, true)
  advance(1); assert.equal(state.getLoadingSnapshot().visible, false)
  const first = state.beginLoading(), second = state.beginLoading()
  first(); advance(1000); assert.equal(state.getLoadingSnapshot().visible, true)
  second(); advance(650); assert.equal(state.getLoadingSnapshot().visible, false)
  state.beginRouteLoading(); advance(15000); advance(650); assert.equal(state.getLoadingSnapshot().visible, false)
  assert.equal(load('lib/loading-state.ts').beginLoading()(), undefined)

  let busy = 0, probes = 0
  const loading = { beginLoading: () => { busy++; return () => { busy-- } } }
  const readiness = load('lib/backend-ready.ts', { fetch: async () => ++probes === 1 ? new Response('<html>Starting</html>', { status: 503, headers: { 'content-type': 'text/html' } }) : Response.json({ message: 'Unauthorized' }, { status: 401 }), setTimeout: fn => { fn(); return 0 } }, { './loading-state': loading })
  await Promise.all([readiness.waitForBackend(), readiness.waitForBackend()])
  assert.equal(probes, 2); assert.equal(busy, 0)
  await readiness.waitForBackend(); assert.equal(probes, 2)

  let requests = 0, warmed = 0
  const api = load('lib/api.ts', { fetch: async () => ++requests === 1 ? new Response('<html>Starting</html>', { headers: { 'content-type': 'text/html' } }) : Response.json({ ok: true }) }, { './loading-state': loading, './backend-ready': { waitForBackend: async () => { warmed++ } } })
  assert.equal((await api.apiFetch('/trilhas')).status, 200)
  assert.equal(requests, 2); assert.equal(warmed, 1); assert.equal(busy, 0)

  requests = 0
  const writes = load('lib/api.ts', { fetch: async () => { requests++; return new Response('<html>Starting</html>', { headers: { 'content-type': 'text/html' } }) } }, { './loading-state': loading, './backend-ready': { waitForBackend: async () => {} } })
  const response = await writes.apiFetch('/simulacoes/id/finalizar', { method: 'POST' })
  assert.equal(response.status, 503); assert.equal(requests, 1); assert.equal(busy, 0)
  const failed = load('lib/api.ts', { fetch: async () => { throw new Error('offline') } }, { './loading-state': loading, './backend-ready': {} })
  await assert.rejects(failed.apiFetch('/trilhas'), /offline/)
  assert.equal(busy, 0)
  let profileRequests = 0
  let failure = false
  const profileApi = load('lib/api.ts', { window: {}, fetch: async () => {
    profileRequests++
    if (failure) throw new Error('offline')
    return Response.json({ id: 'user-1', nome: 'Ana', email: 'ana@example.invalid', foto: '/profile-test.jpg', papel: 'ALUNO' })
  } }, { './loading-state': loading, './backend-ready': {} })
  await Promise.all([profileApi.getCurrentUser(), profileApi.getCurrentUser()])
  assert.equal(profileRequests, 1)
  assert.equal(profileApi.getCachedCurrentUser().foto, '/profile-test.jpg')
  failure = true
  await assert.rejects(profileApi.getCurrentUser(), /offline/)
  assert.equal(profileApi.getCachedCurrentUser().foto, '/profile-test.jpg')
  profileApi.clearCurrentUser()
  assert.equal(profileApi.getCachedCurrentUser(), null)
  console.log('PASS: loading timing, concurrency, backend wake-up, HTML isolation, safe writes, shared avatar cache, transient profile errors and session cleanup.')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
