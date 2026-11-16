const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const { renderToStaticMarkup } = require('react-dom/server')
const React = require('react')
const frontend = path.resolve(__dirname, '..')
const cache = new Map()

function load(file) {
  if (file.endsWith('.css')) return {}
  if (!path.extname(file)) file = ['.ts', '.tsx'].map(extension => file + extension).find(candidate => fs.existsSync(candidate))
  if (!file) throw new Error('Módulo não encontrado')
  if (cache.has(file)) return cache.get(file).exports
  const moduleObject = { exports: {} }
  cache.set(file, moduleObject)
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText
  const localRequire = name => {
    if (name.startsWith('@/')) return load(path.resolve(frontend, name.slice(2)))
    if (name.startsWith('.')) return load(path.resolve(path.dirname(file), name))
    return require(name)
  }
  new Function('require', 'module', 'exports', compiled)(localRequire, moduleObject, moduleObject.exports)
  return moduleObject.exports
}

const { buildCatalog } = load(path.resolve(frontend, '../backend/prisma/content/catalog.ts'))
const { aulasBasicas } = load(path.resolve(frontend, '../backend/prisma/content/modulo-basico.ts'))
const { LessonLearningContent } = load(path.resolve(frontend, 'components/activities/lesson-learning-content.tsx'))
const aulas = [...buildCatalog().courses.flatMap(course => course.aulas), ...aulasBasicas]
let videos = 0
for (const aula of aulas) {
  const lesson = JSON.parse(aula.conteudo)
  const html = renderToStaticMarkup(React.createElement(LessonLearningContent, { lesson, aulaId: aula.id, showDiagram: true }))
  assert.ok(html.includes('<section'), aula.titulo)
  assert.ok(html.includes('Para levar para a próxima aula'), aula.titulo)
  assert.ok(html.includes('Fontes:'), aula.titulo)
  assert.ok(html.includes(lesson.diagram.nodes[0]), aula.titulo)
  if (lesson.video) { assert.ok(html.includes('<video'), aula.titulo); videos++ }
  if (!lesson.introductory) {
    assert.ok(html.includes('Para refletir'), aula.titulo)
    assert.ok(!html.includes('atividade desta página'), aula.titulo)
    assert.ok(!html.includes('type="radio"'), aula.titulo)
    assert.ok(html.replace(/<[^>]*>/g, '').length > 1000, aula.titulo)
  }
}
assert.equal(aulas.length, 96)
console.log(`Renderização verificada: ${aulas.length} aulas, ${videos} vídeos, exemplos, diagramas, reflexões e sínteses visíveis.`)
