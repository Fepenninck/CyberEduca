const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
const { chromium } = require('playwright-core')
const { PrismaClient } = require('../../backend/node_modules/@prisma/client')
const { JwtService } = require('../../backend/node_modules/@nestjs/jwt')

async function main() {
  const baseURL = process.env.PRIVACY_TEST_URL || 'http://localhost:3301'
  const connection = new URL(process.env.DATABASE_URL || '')
  if (!['localhost', '127.0.0.1'].includes(connection.hostname) || !connection.pathname.includes('test')) throw new Error('Use PostgreSQL local de teste.')
  if (!['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname)) throw new Error('Use um site local de teste.')
  if (!process.env.JWT_SECRET) throw new Error('Defina o segredo JWT do servidor de teste.')
  const prisma = new PrismaClient()
  const jwt = new JwtService({ secret: process.env.JWT_SECRET })
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const context = await browser.newContext({ baseURL, viewport: { width: 1365, height: 900 } })
  const page = await context.newPage()
  page.setDefaultTimeout(30000)
  const suffix = randomUUID()
  const version = `browser-${suffix}`
  const email = `termos-${suffix}@example.test`
  let user
  try {
    await page.goto('/admin/termos')
    await page.waitForURL('**/login')
    user = await prisma.usuario.create({ data: { nome: 'Aluno Termos Browser', email } })
    await context.addCookies([{ name: 'cybereduca_session', value: jwt.sign({ sub: user.id }), url: baseURL, httpOnly: true, sameSite: 'Lax' }])
    await page.goto('/admin/termos')
    await page.waitForURL('**/login')
    assert.equal((await context.request.post('/api/admin/termos', { data: {} })).status(), 403)
    const admin = await prisma.usuario.findUniqueOrThrow({ where: { email: 'cybereduca.oficial@gmail.com' } })
    await context.addCookies([{ name: 'cybereduca_session', value: jwt.sign({ sub: admin.id }), url: baseURL, httpOnly: true, sameSite: 'Lax' }])
    await page.goto('/admin/termos')
    await page.locator('#terms-section-title-0').waitFor()
    const previous = await prisma.termosUso.findFirstOrThrow({ orderBy: { id: 'desc' } })
    const previousCount = await page.locator('#terms-panel .terms-editor-section').count()
    assert.equal(await page.getByRole('button', { name: 'Texto completo', exact: true }).count(), 0)
    assert.ok(previous.conteudo.includes(await page.locator('#terms-section-content-0').inputValue()))
    assert.equal(await page.getByRole('button', { name: 'Publicar nova versão', exact: true }).isDisabled(), true)
    console.log('Chrome: somente o administrador pode editar os termos; o texto publicado e carregado.')

    await page.locator('#terms-version').fill(version)
    await page.getByRole('button', { name: 'Adicionar seção', exact: true }).click()
    await page.locator(`#terms-section-title-${previousCount}`).fill('Termos do navegador')
    await page.locator(`#terms-section-content-${previousCount}`).fill('Nova regra publicada no teste.\n\n## Subtitulo dentro da mesma secao\n\n' + 'palavralonga'.repeat(80) + '\n\n<script>window.termosXss = true</script>\n\n[Link inseguro](javascript:alert(1))')
    assert.equal(await page.getByRole('button', { name: 'Pré-visualizar', exact: true }).count(), 0)
    await page.getByRole('button', { name: 'Publicar nova versão', exact: true }).click()
    await page.getByText(`Versão ${version} publicada com sucesso.`, { exact: true }).waitFor()
    assert.ok(await prisma.termosUso.findUnique({ where: { versao: version } }))
    assert.equal((await prisma.termosUso.findUniqueOrThrow({ where: { versao: previous.versao } })).conteudo, previous.conteudo)
    console.log('Chrome: publicacao e preservacao da versao anterior passaram.')

    await context.clearCookies({ name: 'cybereduca_session' })
    await page.goto('/politicas#termos-de-uso')
    await page.getByRole('heading', { name: /Termos do navegador/ }).waitFor()
    assert.equal(await page.locator('#termos-de-uso .legal-card').count(), previousCount + 1)
    assert.equal(await page.locator('.legal-index a').filter({ hasText: 'Termos do navegador' }).count(), 1)
    for (const width of [1365, 390]) {
      await page.setViewportSize({ width, height: 900 })
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    }
    await page.locator('.legal-footer time').waitFor()
    assert.equal(await page.evaluate(() => window.termosXss), undefined)
    assert.ok(!(await page.getByRole('link', { name: 'Link inseguro' }).getAttribute('href') || '').startsWith('javascript:'))
    await context.addCookies([{ name: 'cybereduca_termos_pendentes', value: jwt.sign({ sub: user.id, purpose: 'aceite-termos' }, { audience: 'aceite-termos', expiresIn: '10m' }), url: baseURL, httpOnly: true, sameSite: 'Lax' }])
    await page.goto('/aceitar-termos')
    await page.getByRole('heading', { name: 'Termos do navegador', exact: true }).waitFor()
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Aceitar e continuar', exact: true }).click()
    await page.waitForURL('**/dashboard')
    assert.equal((await prisma.usuario.findUniqueOrThrow({ where: { id: user.id } })).termosVersao, version)
    console.log('Chrome: pagina publica e aceite Google usam o conteudo e a versao publicados pelo admin.')
  } finally {
    await context.close()
    await browser.close()
    await prisma.termosUso.deleteMany({ where: { versao: version } })
    if (user) {
      await prisma.logAuditoria.deleteMany({ where: { OR: [{ atorId: user.id }, { entidadeId: user.id }] } })
      await prisma.usuario.deleteMany({ where: { id: user.id } })
    }
    await prisma.$disconnect()
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1 })
