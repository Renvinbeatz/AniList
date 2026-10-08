import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { randomBytes, randomInt, randomUUID, createHash } from 'node:crypto'
import { existsSync, mkdirSync } from 'node:fs'
import { setTimeout as delay } from 'node:timers/promises'
import { createClient } from '@supabase/supabase-js'

// Opt-in E2E: production Next server, real cookies/Auth/actions/PostgreSQL.
// Error/race UI scenarios intercept only browser HTTP; no application test hooks.
if (!process.argv.includes('--live')) throw new Error('Use --live for isolated official-project browser tests.')
if (existsSync('.env.local')) process.loadEnvFile('.env.local')
if (existsSync('.env')) process.loadEnvFile('.env')
if (new URL(process.env.SUPABASE_URL).hostname !== 'hhprevdkcvqxikmeolxd.supabase.co') throw new Error('Unexpected project')
const base = process.env.STAGE2_BASE_URL || 'http://127.0.0.1:3102'
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('E2E server must be local')
const { chromium } = createRequire(import.meta.url)('playwright')
const options = { auth: { persistSession: false, autoRefreshToken: false } }
const database = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, options)
const auth = createClient(process.env.SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, options)
const profileId = randomUUID()
const username = `v3ui_${randomUUID().replaceAll('-', '').slice(0, 12)}`
const password = randomBytes(24).toString('base64url')
const animeBase = randomInt(1000000000, 1900000000)
const anime = Array.from({ length: 12 }, (_, index) => ({
  id: randomUUID(), anilist_id: animeBase + index, title_romaji: `Etapa 2 Anime ${index + 1}`
}))
const realCatalogueCandidates = new Set()
let authId, browser, passed = 0, failure
const artifacts = 'test-results/stage2'

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
async function eventually(fn, timeout = 20000) {
  const end = Date.now() + timeout
  while (!(await fn())) { if (Date.now() > end) throw new Error('Timed out waiting for browser/database state'); await delay(100) }
}
async function rows(kind) {
  return unwrap(await database.from(kind === 'Favoritos' ? 'profile_favorites' : 'profile_pinned_anime')
    .select('anime_id, position').eq('profile_id', profileId).order('position'))
}
const before = await snapshot()
const originalCatalogueIds = new Set(unwrap(await database.from('anime').select('anilist_id')).map((item) => item.anilist_id))

try {
  assert.equal(unwrap(await database.from('anime').select('id').in('anilist_id', anime.map((item) => item.anilist_id))).length, 0)
  const user = unwrap(await database.auth.admin.createUser({ email: `${username}@ghost.tracker.local`, password, email_confirm: true }))
  authId = user.user.id
  unwrap(await database.from('profiles').insert({ id: profileId, username, auth_user_id: authId }))
  unwrap(await auth.auth.signInWithPassword({ email: `${username}@ghost.tracker.local`, password }))
  unwrap(await database.from('anime').insert(anime))
  browser = await chromium.launch({ headless: true, ...(process.env.STAGE2_BROWSER_PATH ? { executablePath: process.env.STAGE2_BROWSER_PATH } : {}) })
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  const region = (kind) => page.getByRole('region', { name: kind, exact: true })
  const buttonName = (kind) => `Adicionar em ${kind.toLowerCase()}`
  async function login(target) {
    await target.goto(base + '/login')
    await target.getByLabel('Username', { exact: true }).fill(username)
    await target.getByLabel('Senha', { exact: true }).fill(password)
    await target.getByRole('button', { name: 'Entrar', exact: true }).click()
    await target.waitForURL('**/dashboard')
    await target.goto(`${base}/profile/settings`)
    await target.getByRole('heading', { name: 'Coleções do perfil', exact: true }).waitFor()
  }
  async function choose(kind, index) {
    const panel = region(kind)
    await panel.getByRole('button', { name: buttonName(kind), exact: true }).click()
    await panel.getByRole('searchbox').fill(`fixture${index + 1}`)
    await panel.getByRole('button', { name: `Selecionar: ${anime[index].title_romaji}`, exact: true }).click()
    return panel.getByRole('button', { name: `Confirmar em ${kind.toLowerCase()}`, exact: true })
  }
  async function add(kind, index) {
    const confirm = await choose(kind, index)
    await confirm.click()
    await region(kind).getByRole('button', { name: `Remover ${anime[index].title_romaji} de ${kind}`, exact: true }).waitFor()
  }
  async function remove(kind, index) {
    await region(kind).getByRole('button', { name: `Remover ${anime[index].title_romaji} de ${kind}`, exact: true }).click()
    await eventually(async () => !(await rows(kind)).some((row) => row.anime_id === anime[index].id))
    await region(kind).getByRole('button', { name: buttonName(kind), exact: true }).waitFor({ state: 'visible' })
  }

  await check('anonymous browser cannot read protected search or settings', async () => {
    assert.equal((await page.request.get(`${base}/api/profile/anime-search?q=naruto`)).status(), 401)
    await page.goto(`${base}/profile/settings`)
    await page.waitForURL(base + '/')
  })
  await check('real browser login and empty collections', async () => {
    await login(page)
    assert.equal(await region('Favoritos').getByText('Vaga livre', { exact: true }).count(), 10)
    assert.equal(await region('Animes fixados').getByText('Vaga livre', { exact: true }).count(), 6)
    assert.equal((await rows('Favoritos')).length, 0)
  })
  await check('real AniList search, server catalogue resolution and selection without library insertion', async () => {
    const response = await page.request.get(`${base}/api/profile/anime-search?q=Odd%20Taxi`)
    assert.equal(response.status(), 200, 'Actual AniList search must succeed')
    const result = await response.json()
    const candidate = result.results.find((item) => !originalCatalogueIds.has(item.anilist_id))
    assert.ok(candidate, 'Choose an anime absent from the original catalogue')
    realCatalogueCandidates.add(candidate.anilist_id)
    const panel = region('Favoritos')
    await panel.getByRole('button', { name: buttonName('Favoritos'), exact: true }).click()
    await panel.getByRole('searchbox').fill('Odd Taxi')
    await panel.getByRole('button', { name: `Selecionar: ${candidate.title}`, exact: true }).click()
    await panel.getByRole('button', { name: 'Confirmar em favoritos', exact: true }).click()
    await panel.getByRole('button', { name: `Remover ${candidate.title} de Favoritos`, exact: true }).waitFor()
    const cached = unwrap(await database.from('anime').select('id,title_romaji').eq('anilist_id', candidate.anilist_id).single())
    assert.equal(cached.title_romaji, candidate.title)
    assert.equal((await rows('Favoritos'))[0].anime_id, cached.id)
    assert.equal(unwrap(await database.from('user_anime').select('anime_id').eq('profile_id', profileId)).length, 0)
    await panel.getByRole('button', { name: `Remover ${candidate.title} de Favoritos`, exact: true }).click()
    await eventually(async () => (await rows('Favoritos')).length === 0)
  })

  let searchRequests = 0
  await page.route('**/api/profile/anime-search?*', async (route) => {
    searchRequests++
    const q = new URL(route.request().url()).searchParams.get('q')
    if (q === 'network') { await route.abort('failed'); return }
    if (q === 'timeout') { await delay(13500) }
    if (q === 'slow') { await delay(900) }
    if (q === 'error') {
      await route.fulfill({ status: 503, json: { error: 'Não foi possível consultar a AniList agora. Tente novamente.', code: 'UPSTREAM_ERROR' } }); return
    }
    const index = /^fixture(\d+)$/.exec(q)
    const selected = q === 'empty' ? [] : index ? [anime[Number(index[1]) - 1]] : [anime[q === 'fast' ? 1 : 0]]
    try { await route.fulfill({ json: { results: selected.map((item) => ({ anilist_id: item.anilist_id, title: item.title_romaji, cover_image: null, year: 2026 })) } }) }
    catch { /* The previous request may have been cancelled by the actual UI. */ }
  })

  await check('debounce, minimum query length, empty results and search retry', async () => {
    const panel = region('Favoritos')
    await panel.getByRole('button', { name: buttonName('Favoritos'), exact: true }).click()
    const input = panel.getByRole('searchbox')
    await input.fill('a'); await delay(500)
    assert.equal(searchRequests, 0)
    await input.fill('fixture1'); await input.fill('fixture2'); await input.fill('empty')
    await panel.getByText('Nenhum anime encontrado. Tente outro nome.', { exact: true }).waitFor()
    assert.equal(searchRequests, 1)
    await input.fill('error')
    await panel.getByRole('alert').waitFor()
    await panel.getByRole('button', { name: 'Tentar busca novamente' }).click()
    await eventually(() => searchRequests === 3)
    await panel.getByRole('alert').waitFor()
  })
  await check('network failure and real client timeout recover without clearing selection flow', async () => {
    const panel = region('Favoritos')
    await panel.getByRole('searchbox').fill('network')
    await panel.getByText('A busca falhou. Confira sua conexão e tente novamente.', { exact: true }).waitFor()
    await panel.getByRole('searchbox').fill('timeout')
    await panel.getByText('A busca demorou demais. Tente novamente.', { exact: true }).waitFor({ timeout: 18000 })
    await panel.getByRole('searchbox').fill('fixture1')
    await panel.getByRole('button', { name: `Selecionar: ${anime[0].title_romaji}`, exact: true }).waitFor()
    await panel.getByRole('button', { name: 'Cancelar', exact: true }).click()
  })
  await check('out-of-order responses never replace the newest search', async () => {
    const panel = region('Favoritos')
    await panel.getByRole('button', { name: buttonName('Favoritos'), exact: true }).click()
    await panel.getByRole('searchbox').fill('slow')
    await delay(450)
    await panel.getByRole('searchbox').fill('fast')
    await panel.getByRole('button', { name: `Selecionar: ${anime[1].title_romaji}`, exact: true }).waitFor()
    await delay(900)
    assert.equal(await panel.getByRole('button', { name: `Selecionar: ${anime[0].title_romaji}`, exact: true }).count(), 0)
    await panel.getByRole('button', { name: 'Cancelar', exact: true }).click()
  })

  for (const [kind, limit] of [['Favoritos', 10], ['Animes fixados', 6]]) {
    await check(`${kind}: add through every slot, enforce limit and swap full list`, async () => {
      for (let index = 0; index < limit; index++) await add(kind, index)
      assert.equal((await rows(kind)).length, limit)
      assert.equal(await region(kind).getByRole('button', { name: buttonName(kind), exact: true }).isDisabled(), true)
      await region(kind).getByLabel(`Mover ${anime[0].title_romaji} para posição em ${kind}`, { exact: true }).selectOption(String(limit))
      await region(kind).locator(`li[data-position="${limit}"]`).getByText(anime[0].title_romaji, { exact: true }).waitFor()
      const data = await rows(kind)
      assert.equal(data[0].anime_id, anime[limit - 1].id)
      assert.equal(data.at(-1).anime_id, anime[0].id)
    })
  }

  await check('remove leaves a gap; duplicate search result is disabled; free slot can be refilled', async () => {
    await remove('Favoritos', 4)
    const panel = region('Favoritos')
    await panel.getByRole('button', { name: 'Adicionar anime na posição 5 de Favoritos', exact: true }).click()
    await panel.getByRole('searchbox').fill('fixture1')
    const duplicate = panel.getByRole('button', { name: `Já adicionado: ${anime[0].title_romaji}`, exact: true })
    await duplicate.waitFor()
    assert.equal(await duplicate.isDisabled(), true)
    await panel.getByRole('searchbox').fill('fixture11')
    await panel.getByRole('button', { name: `Selecionar: ${anime[10].title_romaji}`, exact: true }).click()
    assert.equal(await panel.getByLabel('Posição para adicionar em Favoritos', { exact: true }).inputValue(), '5')
    await panel.getByRole('button', { name: 'Confirmar em favoritos', exact: true }).click()
    await panel.locator('li[data-position="5"]').getByText(anime[10].title_romaji, { exact: true }).waitFor()
  })

  await check('failed save keeps selection and permits retry; rapid clicks send only one mutation', async () => {
    await remove('Favoritos', 10)
    let posts = 0
    const abortSave = async (route) => {
      if (route.request().method() === 'POST') { posts++; await route.abort('failed') } else await route.continue()
    }
    await page.route('**/profile/settings', abortSave)
    const confirm = await choose('Favoritos', 11)
    await confirm.evaluate((element) => { element.click(); element.click() })
    await page.getByText('Não foi possível confirmar a alteração. Atualize as coleções antes de tentar novamente.', { exact: true }).waitFor()
    assert.equal(posts, 1)
    assert.equal((await rows('Favoritos')).length, 9)
    assert.equal(await region('Favoritos').getByText(`Selecionado: ${anime[11].title_romaji}`, { exact: true }).count(), 1)
    await page.unroute('**/profile/settings', abortSave)
    posts = 0
    const delayedSave = async (route) => {
      if (route.request().method() === 'POST') { posts++; await delay(350) }
      await route.continue()
    }
    await page.route('**/profile/settings', delayedSave)
    await confirm.evaluate((element) => { element.click(); element.click() })
    await region('Favoritos').getByRole('button', { name: `Remover ${anime[11].title_romaji} de Favoritos`, exact: true }).waitFor()
    assert.equal(posts, 1)
    assert.equal((await rows('Favoritos')).length, 10)
    await page.unroute('**/profile/settings', delayedSave)
  })

  await check('keyboard can open search, select, confirm and move', async () => {
    await remove('Favoritos', 11)
    const panel = region('Favoritos')
    const empty = panel.getByRole('button', { name: 'Adicionar anime na posição 5 de Favoritos', exact: true })
    await empty.focus(); await page.keyboard.press('Enter')
    assert.equal(await panel.getByRole('searchbox').evaluate((element) => element === document.activeElement), true)
    await page.keyboard.type('fixture11')
    const result = panel.getByRole('button', { name: `Selecionar: ${anime[10].title_romaji}`, exact: true })
    await result.waitFor(); await result.focus(); await page.keyboard.press('Enter')
    await panel.getByRole('button', { name: 'Confirmar em favoritos', exact: true }).focus()
    await page.keyboard.press('Enter')
    await panel.getByRole('button', { name: `Remover ${anime[10].title_romaji} de Favoritos`, exact: true }).waitFor()
    const mover = panel.getByLabel(`Mover ${anime[10].title_romaji} para posição em Favoritos`, { exact: true })
    await mover.focus(); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter')
    await eventually(async () => (await rows('Favoritos')).find((row) => row.anime_id === anime[10].id).position === 6)
  })

  await check('reload persists both collections and the library stays empty', async () => {
    await page.reload()
    assert.equal(await region('Favoritos').getByRole('button', { name: /^Remover / }).count(), 10)
    assert.equal(await region('Animes fixados').getByRole('button', { name: /^Remover / }).count(), 6)
    assert.equal(await region('Favoritos').getByLabel(`Mover ${anime[10].title_romaji} para posição em Favoritos`, { exact: true }).inputValue(), '6')
    assert.equal(unwrap(await database.from('user_anime').select('anime_id').eq('profile_id', profileId)).length, 0)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    mkdirSync(artifacts, { recursive: true })
    await region('Favoritos').scrollIntoViewIfNeeded()
    await page.screenshot({ path: `${artifacts}/desktop.png` })
  })

  await check('mobile viewport: persisted lists, no horizontal overflow and touch removal', async () => {
    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 })
    const target = await mobile.newPage()
    await login(target)
    const panel = target.getByRole('region', { name: 'Animes fixados', exact: true })
    assert.equal(await panel.getByRole('button', { name: /^Remover / }).count(), 6)
    assert.equal(await target.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    await panel.scrollIntoViewIfNeeded()
    await target.screenshot({ path: `${artifacts}/mobile.png` })
    await panel.getByRole('button', { name: `Remover ${anime[0].title_romaji} de Animes fixados`, exact: true }).tap()
    await panel.getByRole('button', { name: 'Adicionar anime na posição 6 de Animes fixados', exact: true }).waitFor()
    assert.equal((await rows('Animes fixados')).length, 5)
    await mobile.close()
  })
  await check('no uncaught browser runtime errors', async () => { assert.deepEqual(pageErrors, []) })
} catch (error) {
  failure = error
} finally {
  if (browser) await browser.close()
  const cleanupErrors = []
  if ((await auth.auth.signOut()).error) cleanupErrors.push('session')
  if ((await database.from('profiles').delete().eq('id', profileId).eq('username', username)).error) cleanupErrors.push('profile')
  if (authId && (await database.auth.admin.deleteUser(authId)).error) cleanupErrors.push('auth user')
  if ((await database.from('anime').delete().in('id', anime.map((item) => item.id)).gte('anilist_id', animeBase).lt('anilist_id', animeBase + 12)).error) cleanupErrors.push('anime fixtures')
  for (const id of realCatalogueCandidates) {
    if (originalCatalogueIds.has(id)) continue
    const record = unwrap(await database.from('anime').select('id').eq('anilist_id', id).maybeSingle())
    if (!record) continue
    let referenced = false
    for (const table of ['user_anime', 'profile_favorites', 'profile_pinned_anime']) {
      if (unwrap(await database.from(table).select('anime_id').eq('anime_id', record.id)).length) referenced = true
    }
    if (!referenced && (await database.from('anime').delete().eq('id', record.id).eq('anilist_id', id)).error) cleanupErrors.push('resolved anime')
  }
  if (cleanupErrors.length) throw new Error(`Cleanup failure: ${cleanupErrors.join(', ')}`)
}
assert.deepEqual(await snapshot(), before, 'Existing rows must be identical after cleanup')
console.info('PASS cleanup and SHA-256 comparison of every original row')
if (failure) throw failure
console.info(`Browser integration: ${passed + 1} checks passed; fixtures removed; screenshots in ${artifacts}.`)
