const assert = require('node:assert/strict')
const { chromium } = require('playwright-core')

async function main() {
  const baseURL = process.env.PRIVACY_TEST_URL || 'http://localhost:3301'
  if (!['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname)) throw new Error('Use um site local de teste.')
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  try {
    for (const viewport of [{ width: 1365, height: 900 }, { width: 390, height: 844 }]) {
      const context = await browser.newContext({ baseURL, viewport })
      const page = await context.newPage()
      const privateReads = []
      page.on('request', request => {
        if (/\/api\/(usuarios|trilhas|quizzes|simulacoes)(\/|$)/.test(new URL(request.url()).pathname)) privateReads.push(request.url())
      })
      await page.goto('/aceitar-termos')
      const dialog = page.getByRole('dialog', { name: 'Antes de começar', exact: true })
      await dialog.waitFor()
      await dialog.locator('.terms-welcome-document').waitFor()
      assert.equal(await page.locator('dialog').evaluate(element => element.matches(':modal')), true)
      assert.equal(await page.locator('.terms-dashboard-backdrop').getAttribute('inert'), '')
      assert.match(await dialog.evaluate(element => getComputedStyle(element, '::backdrop').backdropFilter), /blur/)
      const bounds = await dialog.boundingBox()
      assert.ok(Math.abs(bounds.x + bounds.width / 2 - viewport.width / 2) < 2)
      assert.ok(Math.abs(bounds.y + bounds.height / 2 - viewport.height / 2) < 2)
      assert.ok(bounds.width <= viewport.width && bounds.height <= viewport.height)
      const submit = dialog.getByRole('button', { name: 'Aceitar e continuar', exact: true })
      assert.equal(await submit.isDisabled(), true)
      await page.keyboard.press('Escape')
      assert.equal(await dialog.isVisible(), true)
      for (let index = 0; index < 12; index++) {
        await page.keyboard.press('Tab')
        // Native dialogs may move focus to browser chrome while cycling Tab.
        assert.equal(await dialog.evaluate(element => element.contains(document.activeElement) || document.activeElement === document.body), true)
      }
      assert.deepEqual(privateReads, [])
      if (process.env.TERMS_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.TERMS_SCREENSHOT_DIR}/termos-${viewport.width}.png` })
      await dialog.getByRole('checkbox').check()
      assert.equal(await submit.isEnabled(), true)
      // No pending Google session: the API must reject acceptance and leave the card open.
      await submit.click()
      await dialog.getByRole('alert').waitFor()
      assert.equal(await dialog.isVisible(), true)
      await dialog.getByRole('link', { name: 'Voltar ao login', exact: true }).click()
      await page.waitForURL('**/login')
      await context.close()
      console.log(`Chrome ${viewport.width}px: fundo inativo, foco, centralizacao, aceite e sessao expirada verificados.`)
    }
  } finally { await browser.close() }
}

main().catch(error => { console.error(error.stack); process.exitCode = 1 })
