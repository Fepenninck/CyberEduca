const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const vm = require('node:vm')
const { spawn } = require('node:child_process')
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')

async function main() {
  const root = path.resolve(__dirname, '..')
  const file = path.join(root, 'components/ui/gooey-loader.tsx')
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 } }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, require: name => name.endsWith('.css') ? {} : require(name) }, { filename: file })
  const html = renderToStaticMarkup(React.createElement('main', { className: 'app-shell dashboard-page' }, React.createElement(exports.GooeyLoader, { label: 'Carregando', size: 104 }), React.createElement(exports.GooeyLoader, { label: 'Outro carregamento', size: 104 })))
  const css = fs.readFileSync(path.join(root, 'components/ui/gooey-loader.css'), 'utf8')
  const screenFile = path.join(root, 'components/ui/loading-screen.tsx')
  const screenCode = ts.transpileModule(fs.readFileSync(screenFile, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 } }).outputText
  const screen = {}
  let pathname = '/dashboard'
  vm.runInNewContext(screenCode, { exports: screen, require: name => name === 'next/navigation' ? { usePathname: () => pathname } : name === '@/lib/student-routes' ? { isStudentPath: value => value === '/dashboard' } : name === './gooey-loader' ? exports : require(name) }, { filename: screenFile })
  const studentScreen = renderToStaticMarkup(React.createElement(screen.LoadingScreen, { fullscreen: true, delayMs: 0 }))
  pathname = '/'
  const publicScreen = renderToStaticMarkup(React.createElement(screen.LoadingScreen, { fullscreen: true, delayMs: 0 }))
  const browserPath = process.env.CHROME_PATH || ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(item => fs.existsSync(item))
  assert.ok(browserPath, 'Defina CHROME_PATH para executar a verificação no navegador.')
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cybereduca-loader-'))
  const browser = spawn(browserPath, ['--headless=new', '--no-sandbox', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] })
  let socket
  try {
    const endpoint = await new Promise((resolve, reject) => {
      let output = ''
      const timer = setTimeout(() => reject(new Error('O navegador não iniciou em 15 segundos.')), 15000)
      browser.once('error', error => { clearTimeout(timer); reject(error) })
      browser.stderr.on('data', chunk => { output += chunk; const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/); if (match) { clearTimeout(timer); resolve(match[1]) } })
    })
    const address = new URL(endpoint)
    const pages = await (await fetch(`http://${address.host}/json/list`)).json()
    socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl)
    await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }) })
    let serial = 0
    const pending = new Map()
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data)
      const request = pending.get(message.id)
      if (!request) return
      clearTimeout(request.timer); pending.delete(message.id)
      if (message.error) request.reject(new Error(JSON.stringify(message.error)))
      else request.resolve(message.result)
    })
    function call(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = ++serial
        const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timeout: ${method} ${params.expression?.slice(0, 70) ?? ''}`)) }, 15000)
        pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params }))
      })
    }
    async function evaluate(expression) {
      const result = await call('Runtime.evaluate', { expression, returnByValue: true })
      assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails))
      return result.result.value
    }
    const version = await call('Browser.getVersion')
    console.log(`Browser: ${version.product}`)
    await call('Runtime.enable')
    assert.equal(await evaluate('1 + 1'), 2)
    await evaluate(`document.body.innerHTML=${JSON.stringify(`<style>body { background: #172334; padding: 40px } main { display: flex; gap: 48px } .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%) } ${css}</style>${html}`)};true`)
    const sample = () => evaluate(`Array.from(document.querySelectorAll('.gooey-loader-dot'), dot => getComputedStyle(dot).transform)`)
    const pause = () => new Promise(resolve => setTimeout(resolve, 320))
    await pause()
    const first = await sample(); await pause(); const second = await sample()
    assert.equal(first.length, 8)
    assert.notDeepEqual(first.slice(0, 4), second.slice(0, 4), 'O primeiro loading ficou estático.')
    assert.notDeepEqual(first.slice(4), second.slice(4), 'O segundo loading ficou estático.')
    await evaluate(`window.loaderMarkup=document.querySelector('main').innerHTML;document.querySelector('main').innerHTML=''`)
    await pause()
    await evaluate(`document.querySelector('main').innerHTML=window.loaderMarkup`)
    await pause(); const remounted = await sample(); await pause()
    assert.notDeepEqual(remounted, await sample(), 'O loading parou ao reaparecer.')
    await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
    await pause(); const reduced = await sample(); await pause()
    assert.notDeepEqual(reduced, await sample(), 'O loading ficou estático no modo de movimento reduzido.')
    const ids = await evaluate(`Array.from(document.querySelectorAll('filter'), node => node.id)`)
    assert.equal(new Set(ids).size, 2, 'Filtros de loadings simultâneos precisam de IDs únicos.')
    if (process.env.LOADER_SCREENSHOT) {
      const screenshot = await call('Page.captureScreenshot', { format: 'png' })
      fs.writeFileSync(process.env.LOADER_SCREENSHOT, Buffer.from(screenshot.data, 'base64'))
    }
    await evaluate(`document.body.innerHTML=${JSON.stringify(`<style>${css}</style><header id="navbar" style="position:fixed;inset:0 0 auto;height:88px;z-index:40">Navbar</header><main id="page" style="background:#080d18"></main>${studentScreen}`)};true`)
    const background = () => evaluate(`getComputedStyle(document.querySelector('.site-loading-screen')).backgroundColor`)
    assert.equal(await background(), 'rgb(23, 35, 52)', 'O primeiro frame deve ter o fundo do aluno.')
    await evaluate(`document.getElementById('page').style.background='#172334';document.getElementById('page').append(document.createElement('article'))`)
    await pause()
    assert.equal(await background(), 'rgb(23, 35, 52)', 'O fundo não deve mudar ao carregar o conteúdo.')
    assert.equal(await evaluate(`document.elementFromPoint(20,20).id`), 'navbar', 'O loading não pode esconder a navbar.')
    await evaluate(`document.querySelector('.site-loading-screen').remove();document.body.insertAdjacentHTML('beforeend', ${JSON.stringify(studentScreen)})`)
    assert.equal(await background(), 'rgb(23, 35, 52)', 'Reapresentar o loading não pode trocar o fundo.')
    await evaluate(`document.body.innerHTML=${JSON.stringify(`<style>${css}</style><main class="home-page" style="background:#0f1623"></main>${publicScreen}`)};true`)
    assert.equal(await background(), 'rgb(15, 22, 35)', 'A página inicial pública precisa do seu próprio fundo desde o primeiro frame.')
    console.log('PASS: animação contínua, reapresentação, movimento reduzido, fundo estável na página inicial e no dashboard, navbar preservada.')
  } finally {
    socket?.close()
    if (browser.exitCode === null) { const closed = new Promise(resolve => browser.once('close', resolve)); browser.kill(); await Promise.race([closed, new Promise(resolve => setTimeout(resolve, 2000))]) }
    const resolved = path.resolve(profile)
    if (resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(resolved).startsWith('cybereduca-loader-')) {
      try { fs.rmSync(resolved, { recursive: true, force: true }) } catch { /* O navegador pode ainda estar liberando arquivos temporários. */ }
    }
  }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
