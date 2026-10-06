import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { randomBytes, randomUUID, createHash } from 'node:crypto'
import { existsSync, mkdirSync } from 'node:fs'
import { setTimeout as delay } from 'node:timers/promises'
import { createClient } from '@supabase/supabase-js'

if (!process.argv.includes('--live')) throw new Error('Use --live for isolated official-project browser tests.')
if (existsSync('.env.local')) process.loadEnvFile('.env.local')
if (existsSync('.env')) process.loadEnvFile('.env')
if (new URL(process.env.SUPABASE_URL).hostname !== 'hhprevdkcvqxikmeolxd.supabase.co') throw new Error('Unexpected project')
const base = process.env.STAGE3_BASE_URL || 'http://127.0.0.1:3102'
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('E2E server must be local')
const { chromium } = createRequire(import.meta.url)('playwright')
const options = { auth: { persistSession: false, autoRefreshToken: false } }
const database = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, options)
const users = Array.from({ length: 2 }, () => ({
  profileId: randomUUID(), username: `v3char_${randomUUID().replaceAll('-', '').slice(0, 12)}`,
  password: randomBytes(24).toString('base64url'), authId: null,
  auth: createClient(process.env.SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, options)
}))
let browser, actionId, failure, passed = 0
const artifacts = 'test-results/stage3'
function unwrap(result) {
  if (result.error) throw new Error(`Supabase operation failed (${result.error.code || 'unknown'})`)
  return result.data
}
async function snapshot() {
  const result = {}
  for (const table of ['profiles', 'anime', 'user_anime', 'profile_favorites', 'profile_pinned_anime']) {
    const rows = unwrap(await database.from(table).select('*'))
    result[table] = { count: rows.length, hash: createHash('sha256').update(rows.map((row) => JSON.stringify(row)).sort().join('\n')).digest('hex') }
  }
  return result
}
async function check(name, fn) { await fn(); passed++; console.info(`PASS ${name}`) }
async function saved(user = users[0]) {
  return unwrap(await database.from('profiles').select('favorite_character_anilist_id,bio').eq('id', user.profileId).single())
}
async function eventually(fn, timeout = 20000) {
  const end = Date.now() + timeout
  while (!(await fn())) { if (Date.now() > end) throw new Error('Timed out waiting for state'); await delay(100) }
}
async function callAction(context, input) {
  assert.ok(actionId)
  const response = await context.request.post(`${base}/profile/settings`, {
    headers: { 'next-action': actionId, origin: base, 'content-type': 'text/plain;charset=UTF-8' },
    data: JSON.stringify([input])
  })
  assert.equal(response.status(), 200)
  return response.text()
}
const before = await snapshot()
try {
  for (const [index, user] of users.entries()) {
    const result = unwrap(await database.auth.admin.createUser({ email: `${user.username}@ghost.tracker.local`, password: user.password, email_confirm: true }))
    user.authId = result.user.id
    // A starts with an ID saved through the previous numeric-field contract.
    unwrap(await database.from('profiles').insert({ id: user.profileId, username: user.username, auth_user_id: user.authId, favorite_character_anilist_id: index === 0 ? 40 : null }))
    unwrap(await user.auth.auth.signInWithPassword({ email: `${user.username}@ghost.tracker.local`, password: user.password }))
  }
  browser = await chromium.launch({ headless: true, ...(process.env.STAGE3_BROWSER_PATH ? { executablePath: process.env.STAGE3_BROWSER_PATH } : {}) })
  const contextA = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await contextA.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url() === `${base}/profile/settings` && request.headers()['next-action']) actionId = request.headers()['next-action']
  })
  const panel = page.getByRole('region', { name: 'Personagem favorito', exact: true })
  async function login(target, user) {
    await target.goto(base)
    await target.getByLabel('Username', { exact: true }).fill(user.username)
    await target.getByLabel('Senha', { exact: true }).fill(user.password)
    await target.getByRole('button', { name: 'Entrar V3', exact: true }).click()
    await target.waitForURL('**/dashboard')
    await target.goto(`${base}/profile/settings`)
    await target.getByRole('heading', { name: 'Personagem favorito', exact: true }).waitFor()
  }
  async function open() {
    await panel.getByRole('button', { name: /^(Trocar|Escolher) personagem$/ }).click()
    await panel.getByRole('searchbox').waitFor()
  }

  await check('anonymous character search is refused', async () => {
    assert.equal((await page.request.get(`${base}/api/profile/character-search?q=luffy`)).status(), 401)
  })
  await check('legacy numeric selection loads name/image without rewriting its ID', async () => {
    await login(page, users[0])
    assert.equal((await saved()).favorite_character_anilist_id, 40)
    assert.equal(await panel.getByText('Personagem salvo', { exact: true }).count(), 0)
    assert.equal(await page.locator('#favoriteCharacter').count(), 0)
    assert.equal(await panel.getByRole('button', { name: 'Trocar personagem', exact: true }).count(), 1)
  })

  const fetched = await page.request.get(`${base}/api/profile/character-search?q=Zoro`)
  assert.equal(fetched.status(), 200, 'Real character API must succeed')
  const characters = (await fetched.json()).results.filter((item) => item.anilist_id !== 40)
  assert.ok(characters.length >= 1)
  const first = characters[0]
  const luffyResponse = await page.request.get(`${base}/api/profile/character-search?q=Luffy`)
  assert.equal(luffyResponse.status(), 200)
  const second = (await luffyResponse.json()).results.find((item) => item.anilist_id !== first.anilist_id)
  assert.ok(second)

  await check('real search, selection, confirmation and reload persist only the character ID', async () => {
    await open()
    await panel.getByRole('searchbox').fill('Zoro')
    await panel.getByRole('button', { name: `Selecionar: ${first.name}`, exact: true }).click()
    await panel.getByRole('button', { name: 'Confirmar personagem', exact: true }).click()
    await panel.getByRole('status').getByText('Personagem favorito atualizado.', { exact: true }).waitFor()
    assert.equal((await saved()).favorite_character_anilist_id, first.anilist_id)
    await page.reload()
    await panel.getByText(first.name, { exact: true }).waitFor()
    assert.equal((await saved()).favorite_character_anilist_id, first.anilist_id)
  })

  await check('saving other profile fields preserves the separately chosen character', async () => {
    await page.getByLabel('Biografia', { exact: true }).fill('Stage 3 isolated bio')
    await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click()
    await page.getByText('Perfil atualizado com sucesso.', { exact: true }).waitFor()
    const row = await saved()
    assert.equal(row.bio, 'Stage 3 isolated bio')
    assert.equal(row.favorite_character_anilist_id, first.anilist_id)
  })

  let searchRequests = 0
  await page.route('**/api/profile/character-search?*', async (route) => {
    searchRequests++
    const q = new URL(route.request().url()).searchParams.get('q')
    if (q === 'slow') await delay(900)
    if (q === 'network') { await route.abort('failed'); return }
    if (q === 'timeout') await delay(13500)
    if (q === 'error') { await route.fulfill({ status: 503, json: { error: 'Não foi possível consultar os personagens na AniList agora. Tente novamente.', code: 'UPSTREAM_ERROR' } }); return }
    const selected = q === 'empty' ? [] : [q === 'current' ? first : q === 'slow' ? first : second]
    try { await route.fulfill({ json: { results: selected.map((item) => ({ ...item, image: null })) } }) }
    catch { /* An old request may have been aborted by the real UI. */ }
  })

  await check('current character is marked and cannot be selected twice; cancellation preserves it', async () => {
    await open()
    await panel.getByRole('searchbox').fill('current')
    const current = panel.getByRole('button', { name: `Já selecionado: ${first.name}`, exact: true })
    await current.waitFor()
    assert.equal(await current.isDisabled(), true)
    await panel.getByRole('button', { name: 'Cancelar escolha', exact: true }).click()
    assert.equal((await saved()).favorite_character_anilist_id, first.anilist_id)
  })
  await check('short queries, empty result, server error and retry', async () => {
    await open()
    const input = panel.getByRole('searchbox')
    const initialRequests = searchRequests
    await input.fill('a'); await delay(500)
    assert.equal(searchRequests, initialRequests)
    await input.fill('empty')
    await panel.getByText('Nenhum personagem encontrado. Tente outro nome.', { exact: true }).waitFor()
    await input.fill('error')
    await panel.getByRole('alert').waitFor()
    const requests = searchRequests
    await panel.getByRole('button', { name: 'Tentar busca novamente', exact: true }).click()
    await eventually(() => searchRequests === requests + 1)
    await panel.getByRole('alert').waitFor()
  })
  await check('network failure and client timeout are recoverable', async () => {
    const input = panel.getByRole('searchbox')
    await input.fill('network')
    await panel.getByText('A busca falhou. Confira sua conexão e tente novamente.', { exact: true }).waitFor()
    await input.fill('timeout')
    await panel.getByText('A busca demorou demais. Tente novamente.', { exact: true }).waitFor({ timeout: 18000 })
    await input.fill('next')
    await panel.getByRole('button', { name: `Selecionar: ${second.name}`, exact: true }).waitFor()
  })
  await check('old response ignored and missing search image uses fallback', async () => {
    const input = panel.getByRole('searchbox')
    await input.fill('slow'); await delay(450); await input.fill('fast')
    const result = panel.getByRole('button', { name: `Selecionar: ${second.name}`, exact: true })
    await result.waitFor(); await delay(900)
    assert.equal(await panel.getByRole('button', { name: `Já selecionado: ${first.name}`, exact: true }).count(), 0)
    assert.equal(await result.locator('img').count(), 0)
    await result.click()
  })

  await check('failed save retains preview; double-click retry performs one save and swaps character', async () => {
    let posts = 0
    const interrupted = async (route) => {
      if (route.request().method() === 'POST') { posts++; await route.abort('failed') } else await route.continue()
    }
    await page.route('**/profile/settings', interrupted)
    const confirm = panel.getByRole('button', { name: 'Confirmar personagem', exact: true })
    await confirm.evaluate((element) => { element.click(); element.click() })
    await panel.getByText('Não foi possível confirmar a alteração. Atualize o personagem antes de tentar novamente.', { exact: true }).waitFor()
    assert.equal(posts, 1)
    assert.equal((await saved()).favorite_character_anilist_id, first.anilist_id)
    assert.equal(await panel.getByText(`Selecionado: ${second.name}`, { exact: true }).count(), 1)
    await page.unroute('**/profile/settings', interrupted)
    posts = 0
    const delayed = async (route) => {
      if (route.request().method() === 'POST') { posts++; await delay(350) }
      await route.continue()
    }
    await page.route('**/profile/settings', delayed)
    await confirm.evaluate((element) => { element.click(); element.click() })
    await panel.getByText('Personagem favorito atualizado.', { exact: true }).waitFor()
    assert.equal(posts, 1)
    assert.equal((await saved()).favorite_character_anilist_id, second.anilist_id)
    await page.unroute('**/profile/settings', delayed)
  })
  await check('malformed and nonexistent IDs are rejected by real HTTP action without mutation', async () => {
    for (const id of [0, -1, 1.5, '40', 2147483648]) {
      assert.ok((await callAction(contextA, { favorite_character_anilist_id: id })).includes('"code":"INVALID_INPUT"'))
    }
    assert.ok((await callAction(contextA, { favorite_character_anilist_id: 2147483647 })).includes('"code":"NOT_FOUND"'))
    assert.equal((await saved()).favorite_character_anilist_id, second.anilist_id)
  })
  await check('two real accounts are isolated even when a direct action supplies spoofed ownership', async () => {
    const contextB = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
    const pageB = await contextB.newPage()
    await login(pageB, users[1])
    const panelB = pageB.getByRole('region', { name: 'Personagem favorito', exact: true })
    await panelB.getByText('Nenhum personagem escolhido.', { exact: true }).waitFor()
    const response = await callAction(contextB, { favorite_character_anilist_id: first.anilist_id, profile_id: users[0].profileId, auth_user_id: users[0].authId })
    assert.ok(response.includes('"success":true'))
    assert.equal((await saved(users[1])).favorite_character_anilist_id, first.anilist_id)
    assert.equal((await saved(users[0])).favorite_character_anilist_id, second.anilist_id)
    await pageB.reload()
    await panelB.getByText(first.name, { exact: true }).waitFor()
    assert.equal(await pageB.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    mkdirSync(artifacts, { recursive: true })
    await panelB.scrollIntoViewIfNeeded()
    await pageB.screenshot({ path: `${artifacts}/mobile.png` })
    await panelB.getByRole('button', { name: 'Remover personagem', exact: true }).tap()
    await panelB.getByText('Nenhum personagem escolhido.', { exact: true }).waitFor()
    assert.equal((await saved(users[1])).favorite_character_anilist_id, null)
    assert.equal((await saved(users[0])).favorite_character_anilist_id, second.anilist_id)
    await contextB.close()
  })

  await check('broken image falls back and legacy unavailable ID stays saved until removal', async () => {
    await page.route('**/_next/image?*', async (route) => route.abort('failed'))
    await page.reload()
    await panel.getByText(second.name, { exact: true }).waitFor()
    await eventually(async () => (await panel.locator('img').count()) === 0)
    unwrap(await database.from('profiles').update({ favorite_character_anilist_id: 2147483647 }).eq('id', users[0].profileId))
    await page.reload()
    await panel.getByText('Personagem salvo', { exact: true }).waitFor()
    assert.equal((await saved()).favorite_character_anilist_id, 2147483647)
    await panel.getByRole('button', { name: 'Tentar carregar personagem novamente', exact: true }).click()
    await panel.getByText('Personagem salvo', { exact: true }).waitFor()
    assert.equal((await saved()).favorite_character_anilist_id, 2147483647)
    await panel.getByRole('button', { name: 'Remover personagem', exact: true }).click()
    await panel.getByText('Nenhum personagem escolhido.', { exact: true }).waitFor()
    assert.equal((await saved()).favorite_character_anilist_id, null)
  })
  await check('keyboard selection, confirmation and final reload', async () => {
    await panel.getByRole('button', { name: 'Escolher personagem', exact: true }).focus()
    await page.keyboard.press('Enter')
    assert.equal(await panel.getByRole('searchbox').evaluate((element) => element === document.activeElement), true)
    await page.keyboard.type('keyboard')
    const result = panel.getByRole('button', { name: `Selecionar: ${second.name}`, exact: true })
    await result.waitFor(); await result.focus(); await page.keyboard.press('Enter')
    await panel.getByRole('button', { name: 'Confirmar personagem', exact: true }).focus()
    await page.keyboard.press('Enter')
    await panel.getByText('Personagem favorito atualizado.', { exact: true }).waitFor()
    await page.reload()
    await panel.getByText(second.name, { exact: true }).waitFor()
    assert.equal((await saved()).favorite_character_anilist_id, second.anilist_id)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    await panel.scrollIntoViewIfNeeded()
    await page.screenshot({ path: `${artifacts}/desktop.png` })
    assert.deepEqual(errors, [])
  })
  await check('anonymous direct mutation is rejected, libraries and collections remain empty', async () => {
    const anonymous = await browser.newContext()
    assert.ok((await callAction(anonymous, { favorite_character_anilist_id: 40 })).includes('"code":"UNAUTHORIZED"'))
    await anonymous.close()
    for (const table of ['user_anime', 'profile_favorites', 'profile_pinned_anime']) {
      assert.equal(unwrap(await database.from(table).select('profile_id').in('profile_id', users.map((user) => user.profileId))).length, 0)
    }
  })
} catch (error) {
  failure = error
} finally {
  if (browser) await browser.close()
  const cleanupErrors = []
  for (const user of users) {
    if ((await user.auth.auth.signOut()).error) cleanupErrors.push('session')
    if ((await database.from('profiles').delete().eq('id', user.profileId).eq('username', user.username)).error) cleanupErrors.push('profile')
    if (user.authId && (await database.auth.admin.deleteUser(user.authId)).error) cleanupErrors.push('auth user')
  }
  if (cleanupErrors.length) throw new Error(`Cleanup failure: ${cleanupErrors.join(', ')}`)
}
assert.deepEqual(await snapshot(), before, 'Existing rows must be identical after fixture cleanup')
console.info('PASS cleanup and SHA-256 comparison of every original row')
if (failure) throw failure
console.info(`Character browser integration: ${passed + 1} checks passed; fixtures removed; screenshots in ${artifacts}.`)
