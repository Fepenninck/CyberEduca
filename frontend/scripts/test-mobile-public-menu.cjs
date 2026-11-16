const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const root = path.resolve(__dirname, '..')
const cache = new Map()
function load(file) {
  if (file.endsWith('.css')) return {}
  if (!path.extname(file)) file = ['.ts', '.tsx'].map(extension => file + extension).find(candidate => fs.existsSync(candidate))
  if (!file) throw new Error('Module not found')
  if (cache.has(file)) return cache.get(file).exports
  const module = { exports: {} }
  cache.set(file, module)
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
  const importer = name => {
    if (name === 'next/link') return ({ children, ...props }) => React.createElement('a', props, children)
    if (name.startsWith('@/')) return load(path.join(root, name.slice(2)))
    if (name.startsWith('.')) return load(path.resolve(path.dirname(file), name))
    return require(name)
  }
  new Function('require', 'module', 'exports', compiled)(importer, module, module.exports)
  return module.exports
}
const { platformGroups } = load(path.join(root, 'components/platform-mega-menu.tsx'))
const { MobilePublicMenu } = load(path.join(root, 'components/mobile-public-menu.tsx'))
for (const home of [false, true]) {
  const html = renderToStaticMarkup(React.createElement(MobilePublicMenu, { home }))
  assert.match(html, /<summary[^>]*>Plataforma/)
  assert.doesNotMatch(html, /<a[^>]*>Plataforma<\/a>/)
  for (const group of platformGroups) for (const item of group.items) assert.ok(html.includes(`href="${item.href}">${item.title}</a>`))
  assert.ok(html.includes(home ? 'Começar agora' : 'Acessar'))
}
for (const file of ['components/cyber-header.tsx', 'app/page.tsx']) {
  const exports = load(path.join(root, file))
  const component = exports.CyberHeader ?? exports.default
  const html = renderToStaticMarkup(React.createElement(component))
  assert.equal((html.match(/class="mobile-platform-menu"/g) ?? []).length, 1, file)
  assert.match(html, /<summary[^>]*>Plataforma/)
  assert.doesNotMatch(html, /<a[^>]*>Plataforma<\/a>/)
}
console.log('OK: home and public pages use the same expandable mobile platform menu and desktop destinations.')
