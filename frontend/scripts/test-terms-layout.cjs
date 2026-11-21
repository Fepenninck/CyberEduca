const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const path = require('node:path')
const fs = require('node:fs')
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const { chromium } = require('playwright-core')
const { PrismaClient } = require('../../backend/node_modules/@prisma/client')
const { JwtService } = require('../../backend/node_modules/@nestjs/jwt')

async function main() {
  const baseURL = process.env.PRIVACY_TEST_URL || 'http://localhost:3301'
  const connection = new URL(process.env.DATABASE_URL || '')
  if (!['localhost', '127.0.0.1'].includes(connection.hostname) || !connection.pathname.includes('test')) throw new Error('Use PostgreSQL local de teste.')
  if (!['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname)) throw new Error('Use um site local de teste.')
  if (!process.env.JWT_SECRET) throw new Error('Defina o segredo JWT de teste.')
  // The committed page is the reference for restoring every original title, text and anchor.
  const source = execFileSync('git', ['show', 'b253d2f:frontend/components/legal-policy-content.tsx'], { cwd: path.join(__dirname, '../..'), encoding: 'utf8' })
  const original = { exports: {} }
  const compiled = ts.transpileModule(source.slice(source.indexOf('const terms ='), source.indexOf('const privacy =')) + '\nmodule.exports = terms;', { compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS } }).outputText
  new Function('React', 'Link', 'module', compiled)(React, 'a', original)
  const expected = original.exports.map(([id, title, content]) => ({ id, title, html: renderToStaticMarkup(content) }))
  const prisma = new PrismaClient()
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  try {
    const current = await prisma.termosUso.findFirstOrThrow({ orderBy: { id: 'desc' } })
    for (const viewport of [{ width: 1365, height: 900 }, { width: 390, height: 844 }]) {
      const context = await browser.newContext({ baseURL, viewport })
      const page = await context.newPage()
      await page.goto('/politicas#termos-de-uso')
      await page.locator('#termos-de-uso .legal-card').first().waitFor()
      assert.equal(await page.locator('#termos-de-uso .legal-card').count(), expected.length)
      for (const [index, section] of expected.entries()) {
        const card = page.locator(`#${section.id}`)
        assert.equal(await card.count(), 1)
        assert.ok((await card.locator('h2').innerText()).includes(section.title))
        assert.equal(await card.locator('h2 span').innerText(), String(index + 1).padStart(2, '0'))
        const expectedText = await page.evaluate(html => {
          const element = document.createElement('div'); element.innerHTML = html
          element.querySelectorAll('p,li').forEach(node => node.append(' '))
          return element.textContent.replace(/\s+/g, ' ').trim()
        }, section.html)
        assert.equal((await card.locator('.legal-copy').innerText()).replace(/\s+/g, ' ').trim(), expectedText)
      }
      if (viewport.width > 760) {
        for (const section of expected) assert.equal(await page.locator(`.legal-index a[href="#${section.id}"]`).count(), 1)
        const first = await page.locator('#aceitacao').boundingBox()
        const second = await page.locator('#finalidade').boundingBox()
        const third = await page.locator('#conta').boundingBox()
        assert.ok(first.width > second.width * 1.8)
        assert.ok(Math.abs(second.y - third.y) < 2)
      } else assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      if (process.env.TERMS_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.TERMS_SCREENSHOT_DIR}/termos-restaurados-${viewport.width}.png` })
      await context.close()
      console.log(`Chrome ${viewport.width}px: todos os textos originais, numeracao e disposicao dos cards verificados.`)
    }
    const admin = await prisma.usuario.findUniqueOrThrow({ where: { email: 'cybereduca.oficial@gmail.com' } })
    const context = await browser.newContext({ baseURL, viewport: { width: 1365, height: 900 } })
    await context.addCookies([{ name: 'cybereduca_session', value: new JwtService({ secret: process.env.JWT_SECRET }).sign({ sub: admin.id }), url: baseURL, httpOnly: true }])
    const page = await context.newPage()
    await page.goto('/admin/termos')
    await page.locator('#terms-section-title-0').waitFor()
    assert.equal(await page.locator('.terms-editor-section').count(), expected.length)
    assert.equal(await page.locator('#terms-section-title-0').inputValue(), expected[0].title)
    assert.equal(await page.getByRole('button', { name: 'Texto completo', exact: true }).count(), 0)
    assert.equal(await page.getByRole('button', { name: 'Pré-visualizar', exact: true }).count(), 0)
    await page.locator('#terms-section-content-0').press('Control+End')
    await page.locator('#terms-section-content-0').pressSequentially(' Texto adicional.')
    assert.ok((await page.locator('#terms-section-content-0').inputValue()).endsWith(' Texto adicional.'))
    await page.getByRole('button', { name: 'Adicionar seção', exact: true }).click()
    await page.locator(`#terms-section-title-${expected.length}`).fill('Novo tópico')
    await page.locator(`#terms-section-content-${expected.length}`).fill('Texto do novo tópico para a edição dos termos.')
    await page.getByRole('button', { name: `Subir seção ${expected.length + 1}`, exact: true }).click()
    assert.equal(await page.locator(`#terms-section-title-${expected.length - 1}`).inputValue(), 'Novo tópico')
    // Editing must never publish silently.
    assert.equal((await prisma.termosUso.findFirstOrThrow({ orderBy: { id: 'desc' } })).conteudo, current.conteudo)
    await context.close()
    console.log('Chrome: admin conserva o texto salvo, sem previa; edicao por secoes e ordem verificadas.')
  } finally { await browser.close(); await prisma.$disconnect() }
}

main().catch(error => { console.error(error.stack); process.exitCode = 1 })
