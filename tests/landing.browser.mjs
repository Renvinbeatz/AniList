import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { randomBytes, randomUUID, createHash } from 'node:crypto'
import { existsSync, mkdirSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

if (!process.argv.includes('--live')) throw new Error('Use --live for isolated official-project browser tests.')
if (existsSync('.env.local')) process.loadEnvFile('.env.local')
if (existsSync('.env')) process.loadEnvFile('.env')
if (new URL(process.env.SUPABASE_URL).hostname !== 'hhprevdkcvqxikmeolxd.supabase.co') throw new Error('Unexpected project')
const base = process.env.LANDING_BASE_URL || 'http://127.0.0.1:3102'
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('E2E server must be local')
const { chromium } = createRequire(import.meta.url)('playwright')
const database = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {auth: {persistSession: false, autoRefreshToken: false}})
const users = Array.from({length: 2}, () => ({username: 'v4home_' + randomUUID().replaceAll('-', '').slice(0, 12), password: randomBytes(24).toString('base64url'), authId: null}))
const artifacts = 'test-results/landing'
let browser, failure, passed = 0
function unwrap(result) { if (result.error) throw new Error(`Supabase operation failed (${result.error.code || 'unknown'})`); return result.data }
async function snapshot() {
  const result = {}
  for (const table of ['profiles', 'anime', 'user_anime', 'profile_favorites', 'profile_pinned_anime']) {
    const rows = unwrap(await database.from(table).select('*'))
    result[table] = {count: rows.length, hash: createHash('sha256').update(rows.map(row => JSON.stringify(row)).sort().join('\n')).digest('hex')}
  }
  return result
}
async function check(name, fn) { await fn(); passed++; console.info('PASS ' + name) }
async function login(page, user) {
  await page.goto(base + '/login')
  await page.getByLabel('Username', {exact: true}).fill(user.username)
  await page.getByLabel('Senha', {exact: true}).fill(user.password)
  await page.getByRole('button', {name: 'Entrar', exact: true}).click()
  await page.waitForURL('**/dashboard')
}
const before = await snapshot()
try {
  const created = unwrap(await database.auth.admin.createUser({email: users[0].username + '@ghost.tracker.local', password: users[0].password, email_confirm: true}))
  users[0].authId = created.user.id
  unwrap(await database.from('profiles').insert({username: users[0].username, auth_user_id: users[0].authId}))
  browser = await chromium.launch({headless: true, executablePath: process.env.LANDING_BROWSER_PATH})
  const context = await browser.newContext({viewport: {width: 1440, height: 1000}})
  const page = await context.newPage(), errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.setDefaultTimeout(20000)
  await check('first visit presents Anicat and links to the available community without a login form', async () => {
    const response = await page.goto(base)
    assert.equal(response.status(), 200)
    assert.equal(new URL(page.url()).pathname, '/')
    assert.equal(await page.title(), 'Anicat')
    await page.getByRole('heading', {name: /Um lugar para/}).waitFor()
    assert.equal(await page.locator('form').count(), 0)
    await page.getByText('Exemplo de biblioteca', {exact: true}).waitFor()
    const community = page.getByRole('region', {name: 'Suas histórias também viram conversa.', exact: true})
    assert.equal(await community.getByText('COMUNIDADE ANICAT', {exact: true}).count(), 1)
    assert.equal(await community.getByRole('link',{name:'Conhecer a comunidade',exact:false}).getAttribute('href'), '/community')
    await page.waitForFunction(() => [...document.querySelectorAll('figure img')].filter(img => img.src.includes('_next/image')).length === 3 && [...document.querySelectorAll('figure img')].every(img => img.complete && img.naturalWidth > 0))
    mkdirSync(artifacts, {recursive: true})
    await page.screenshot({path: artifacts + '/desktop.png', fullPage: true})
  })
  await check('responsive landing and auth pages fit phones, tablets and desktop', async () => {
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({width, height: 900})
      for (const route of ['/', '/login', '/signup']) {
        await page.goto(base + route)
        await page.getByRole('heading').first().waitFor()
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${route} overflows at ${width}`)
      }
      if (width === 390) { await page.goto(base); await page.screenshot({path: artifacts + '/mobile.png', fullPage: true}) }
    }
  })
  await check('header and call-to-action links open the intended login or signup form', async () => {
    await page.goto(base)
    await page.getByRole('navigation', {name: 'Navegação da página inicial'}).getByRole('link', {name: 'Entrar', exact: true}).click()
    await page.waitForURL('**/login')
    await page.getByLabel('Username', {exact: true}).waitFor()
    await page.getByRole('link', {name: 'Voltar para a Anicat', exact: false}).click()
    await page.waitForURL(base + '/')
    await page.getByRole('link', {name: 'Crie sua conta', exact: true}).click()
    await page.waitForURL('**/signup')
    await page.getByLabel('Criar Username', {exact: true}).waitFor()
    assert.equal(await page.title(), 'Criar conta · Anicat')
  })
  await check('native anchors and keyboard skip link reach the requested section', async () => {
    await page.goto(base)
    await page.getByRole('link', {name: 'Veja como funciona', exact: true}).focus(); await page.keyboard.press('Enter')
    await page.waitForURL('**/#recursos')
    assert.ok(await page.locator('#recursos').evaluate(el => el.getBoundingClientRect().top >= 80))
    await page.getByRole('link', {name: 'Pular para o conteúdo principal', exact: true}).focus(); await page.keyboard.press('Enter')
    await page.waitForURL('**/#main-content')
    assert.equal(await page.locator('main').evaluate(el => el === document.activeElement), true)
  })
  await check('private entry points consistently open login for visitors', async () => {
    for (const route of ['/dashboard', '/calendar', '/today', '/library', '/profile', '/profile/settings']) {
      await page.goto(base + route)
      assert.equal(new URL(page.url()).pathname, '/login')
      await page.getByLabel('Username', {exact: true}).waitFor()
    }
  })
  await check('existing login, authenticated redirects and logout preserve the session flow', async () => {
    await page.getByLabel('Username', {exact: true}).fill(users[0].username)
    await page.getByLabel('Senha', {exact: true}).fill('wrong-password-for-test')
    await page.getByRole('button', {name: 'Entrar', exact: true}).click()
    await page.getByRole('alert').getByText('Credenciais inválidas.', {exact: true}).waitFor()
    await login(page, users[0])
    for (const route of ['/', '/login', '/signup']) { await page.goto(base + route); assert.equal(new URL(page.url()).pathname, '/dashboard') }
    await page.goto(base + '/profile')
    await page.getByRole('heading', {name: users[0].username, exact: true}).waitFor()
    await page.getByRole('button', {name: 'Sair da conta', exact: true}).click()
    await page.waitForURL(base + '/')
    await page.getByRole('heading', {name: /Um lugar para/}).waitFor()
    assert.equal(await page.locator('form').count(), 0)
  })
  await check('signup opens directly, rejects duplicate username and creates a usable account', async () => {
    await page.goto(base + '/signup')
    await page.getByLabel('Criar Username', {exact: true}).fill(users[0].username)
    await page.getByLabel('Criar Senha', {exact: true}).fill(users[0].password)
    await page.getByRole('button', {name: 'Criar conta', exact: true}).click()
    await page.getByRole('alert').getByText('Username já está em uso.', {exact: true}).waitFor()
    await page.getByLabel('Criar Username', {exact: true}).fill(users[1].username)
    await page.getByLabel('Criar Senha', {exact: true}).fill(users[1].password)
    await page.getByRole('button', {name: 'Criar conta', exact: true}).click()
    await page.waitForURL('**/dashboard')
    const profile = unwrap(await database.from('profiles').select('auth_user_id').eq('username', users[1].username).single())
    users[1].authId = profile.auth_user_id
    await page.goto(base + '/profile/settings')
    await page.getByRole('heading', {name: 'Configurações', exact: true}).waitFor()
    await page.goto(base + '/profile')
    await page.getByRole('heading', {name: users[1].username, exact: true}).waitFor()
    await page.getByRole('button', {name: 'Sair da conta', exact: true}).click()
    await page.waitForURL(base + '/')
  })
  await check('landing and existing login work with JavaScript disabled', async () => {
    const native = await browser.newContext({javaScriptEnabled: false})
    try {
      const plain = await native.newPage()
      await plain.goto(base)
      await plain.getByRole('link', {name: 'Crie sua conta', exact: true}).waitFor()
      await plain.getByRole('navigation', {name: 'Navegação da página inicial'}).getByRole('link', {name: 'Entrar', exact: true}).click()
      await plain.getByLabel('Username', {exact: true}).fill(users[0].username)
      await plain.getByLabel('Senha', {exact: true}).fill(users[0].password)
      await plain.getByRole('button', {name: 'Entrar', exact: true}).click({force: true})
      await plain.waitForURL('**/dashboard')
      await plain.goto(base + '/profile')
      await plain.getByRole('button', {name: 'Sair da conta', exact: true}).click({force: true})
      await plain.waitForURL(base + '/')
    } finally { await native.close() }
  })
  await check('unavailable artwork falls back without breaking navigation or runtime', async () => {
    await page.route('**/_next/image?*', route => route.abort('failed'))
    await page.goto(base)
    await page.getByText('Sem capa', {exact: true}).first().waitFor()
    assert.equal(await page.getByRole('link', {name: 'Crie sua conta', exact: true}).isVisible(), true)
    assert.deepEqual(errors, [])
  })
} catch (error) { failure = error }
finally {
  if (browser) await browser.close()
  const cleanupErrors = []
  for (const user of users) {
    const found = await database.from('profiles').select('id,auth_user_id').eq('username', user.username).maybeSingle()
    if (found.error) { cleanupErrors.push('profile lookup'); continue }
    if (found.data) {
      user.authId = found.data.auth_user_id
    }
    if (user.authId) {
      const identity = await database.auth.admin.getUserById(user.authId)
      const auth = createClient(process.env.SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {auth: {persistSession: false, autoRefreshToken: false}})
      const signed = await auth.auth.signInWithPassword({email: identity.data.user?.email || '', password: user.password})
      if (signed.error || (await auth.auth.signOut({scope: 'global'})).error) cleanupErrors.push('session revocation')
    }
    if (found.data && (await database.from('profiles').delete().eq('id', found.data.id).eq('username', user.username)).error) cleanupErrors.push('profile')
    if (user.authId && (await database.auth.admin.deleteUser(user.authId)).error) cleanupErrors.push('auth user')
  }
  if (cleanupErrors.length) throw new Error('Cleanup failure: ' + cleanupErrors.join(', '))
}
assert.deepEqual(await snapshot(), before, 'Existing rows must remain unchanged')
console.info('PASS cleanup and SHA-256 comparison of every original row')
if (failure) throw failure
console.info(`Landing browser integration: ${passed + 1} checks passed; fixtures removed.`)
