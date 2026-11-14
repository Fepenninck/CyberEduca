const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const Module = require('node:module')
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const root = path.resolve(__dirname, '..')
const resolve = Module._resolveFilename
Module._resolveFilename = function (request, ...rest) {
  return resolve.call(this, request.startsWith('@/') ? path.join(root, request.slice(2)) : request, ...rest)
}
for (const extension of ['.ts', '.tsx']) require.extensions[extension] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  }, fileName: filename })
  module._compile(outputText, filename)
}
require.extensions['.css'] = () => {}
const { ImmersiveSimulation } = require('../components/activities/immersive-simulation.tsx')
const { PhishingInteractiveContent } = require('../components/phishing/phishing-interactive-content.tsx')
const { SIMULATION_SEEDS } = require('../../backend/prisma/content/simulations.ts')
const expected = ['scene-account', 'scene-admin', 'scene-phone', 'scene-desktop', 'scene-social', 'scene-drive', 'scene-cafe', 'scene-router', 'scene-chat', 'scene-soc', 'scene-ide', 'scene-ide']
let checks = 0
for (const [index, seed] of SIMULATION_SEEDS.entries()) {
  for (const [step, source] of seed.decisoes.entries()) {
    const decision = { id: `${seed.key}:${step}`, contexto: source.contexto, enunciado: source.enunciado,
      alternativas: [source.correta, ...source.outras].map((texto, i) => ({ id: `option-${i}`, texto })) }
    for (const option of decision.alternativas) {
      const markup = renderToStaticMarkup(React.createElement(ImmersiveSimulation, { title: seed.titulo, category: seed.categoria,
        decision, step, selected: option.id, disabled: false, onChoose: () => {} }))
      assert.ok(markup.includes(expected[index]), `${seed.key}: missing dedicated environment`)
      assert.equal((markup.match(/aria-pressed="true"/g) || []).length, 1, `${seed.key}: selection not restored`)
      assert.ok(!markup.includes('<fieldset'), `${seed.key}: questionnaire returned`)
      assert.ok(!markup.includes('href="http'), `${seed.key}: external navigation`)
      assert.ok(markup.includes('scene-action-receipt'), `${seed.key}: action not acknowledged`)
      checks++
    }
  }
}
const hostile = '<script>alert(1)</script> https://example.invalid/entrar anexo.exe'
const markup = renderToStaticMarkup(React.createElement(PhishingInteractiveContent, { content: hostile }))
assert.ok(!markup.includes('<script>'), 'Message content executed as HTML')
assert.ok(!markup.includes('href='), 'External phishing URL became a real link')
assert.ok(markup.includes('phishing-inline-link') && markup.includes('phishing-attachment'), 'URL or attachment is not interactive')
assert.ok(markup.includes('&lt;script&gt;'), 'Message markup must remain escaped')
console.log(`${checks} scenario/action combinations rendered across 12 scenarios; phishing URL, attachment and HTML isolation checks passed.`)
