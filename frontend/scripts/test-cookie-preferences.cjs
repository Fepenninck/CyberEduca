const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const source = fs.readFileSync(path.join(__dirname, '../lib/cookie-preferences.ts'), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const moduleObject = { exports: {} }
new Function('exports', 'module', compiled)(moduleObject.exports, moduleObject)
const prefs = moduleObject.exports
const storage = new Map([['session', 'preservar']])
global.localStorage = {
  get length() { return storage.size },
  key: index => [...storage.keys()][index],
  removeItem: key => storage.delete(key),
}
let cookie = ''
global.document = {
  get cookie() { return cookie },
  set cookie(value) { cookie = value },
}
global.window = { location: { protocol: 'https:' } }
for (const value of ['', 'accepted', 'v1-essential', 'invalido']) {
  cookie = `${prefs.CONSENT_COOKIE}=${value}`
  assert.equal(prefs.readCookiePreferences(cookie), null)
  assert.equal(prefs.canRememberCelebrations(), false)
}
assert.equal(prefs.saveCookiePreferences(true), true)
assert.equal(prefs.canRememberCelebrations(), true)
assert.match(cookie, /; Secure/)
assert.match(cookie, /Max-Age=15552000/)
storage.set('cybereduca-achievement:aluno:conquista', 'shown')
assert.equal(prefs.saveCookiePreferences(false), true)
assert.equal(prefs.canRememberCelebrations(), false)
assert.deepEqual([...storage], [['session', 'preservar']])
// A blocked write cannot be reported as a successful consent change.
Object.defineProperty(global.document, 'cookie', { get: () => '', set: () => {} })
assert.equal(prefs.saveCookiePreferences(true), false)
console.log('Cookies: consentimento, revogacao, limpeza seletiva e bloqueio verificados.')
