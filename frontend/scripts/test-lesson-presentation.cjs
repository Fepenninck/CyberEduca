const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const source = fs.readFileSync(path.resolve(__dirname, '../lib/lesson-presentation.ts'), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const moduleObject = { exports: {} }
new Function('module', 'exports', compiled)(moduleObject, moduleObject.exports)
const { apresentarOrientacao } = moduleObject.exports
const original = 'Acompanhe o exemplo de “Uma cópia para não perder seus arquivos”. Observe a relação entre arquivo original e cópia separada; depois, escolha uma resposta na atividade desta página. A correção aparece aqui no site.'
const shown = apresentarOrientacao(original)
assert.ok(shown.includes('arquivo original e cópia separada'))
assert.ok(!shown.includes('atividade desta página'))
assert.ok(!shown.includes('correção aparece'))
assert.equal(apresentarOrientacao(shown), shown)
assert.equal(apresentarOrientacao('Observe uma situação do vídeo e pense no cuidado que ajudaria a pessoa. Você responde à atividade nesta página.'), 'Observe uma situação do vídeo e pense no cuidado que ajudaria a pessoa.')
const technical = '## Exemplo\n\nNão reutilize senhas.\n\n```js\nconst exemplo = 1;\n```'
assert.equal(apresentarOrientacao(technical), technical)
assert.equal(apresentarOrientacao(''), '')
console.log('Apresentação das aulas: orientações corrigidas, conteúdo e Markdown preservados.')
