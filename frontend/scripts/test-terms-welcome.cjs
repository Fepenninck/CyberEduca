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
      const card = page.locator('.login-card')
      await card.getByRole('heading', { name: 'Antes de continuar', exact: true }).waitFor()
      await card.getByLabel('Termos de Uso publicados', { exact: true }).waitFor()
      assert.ok((await card.locator('.consent-document').boundingBox()).height <= 162)
      assert.equal(await card.locator('.consent-data-summary').count(), 0)
      assert.equal(await card.locator('.consent-document').evaluate(element => getComputedStyle(element, '::-webkit-scrollbar').width), '8px')
      assert.equal(await card.locator('.consent-document').evaluate(element => getComputedStyle(element, '::-webkit-scrollbar-button').display), 'none')
      assert.equal(await card.getByRole('tab', { name: 'Termos de Uso', exact: true }).evaluate(element => getComputedStyle(element).borderBottomWidth), '0px')
      await card.getByRole('tab', { name: 'Privacidade e LGPD', exact: true }).click()
      await card.getByLabel('Política de Privacidade publicada', { exact: true }).waitFor()
      assert.ok((await card.locator('.consent-document').innerText()).includes('Dados utilizados pelo site'))
      await card.getByRole('tab', { name: 'Termos de Uso', exact: true }).click()
      const reject = page.getByRole('button', { name: 'Rejeitar', exact: true })
      if (await reject.isVisible()) await reject.click()
      assert.equal(await page.locator('dialog').count(), 0)
      assert.equal(await page.locator('.terms-dashboard-backdrop').count(), 0)
      const bounds = await card.boundingBox()
      assert.ok(bounds.width <= viewport.width)
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      const submit = card.getByRole('button', { name: 'Aceitar e continuar', exact: true })
      assert.equal(await submit.isDisabled(), true)
      assert.deepEqual(privateReads, [])
      if (process.env.TERMS_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.TERMS_SCREENSHOT_DIR}/termos-${viewport.width}.png` })
      await card.getByRole('checkbox').check()
      assert.equal(await submit.isEnabled(), true)
      // No pending Google session: the API must reject acceptance and leave the card open.
      await submit.click()
      await card.getByRole('alert').waitFor()
      assert.equal(await card.isVisible(), true)
      await card.getByRole('link', { name: 'Voltar ao login', exact: true }).click()
      await page.waitForURL('**/login')
      await context.close()
      console.log(`Chrome ${viewport.width}px: card anterior, ausencia de fundo borrado, aceite e sessao expirada verificados.`)
    }
  } finally { await browser.close() }
}

main().catch(error => { console.error(error.stack); process.exitCode = 1 })
