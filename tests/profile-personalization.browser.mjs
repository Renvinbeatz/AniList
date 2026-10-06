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
const base = process.env.STAGE4_BASE_URL || 'http://127.0.0.1:3102'
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('E2E server must be local')
const { chromium } = createRequire(import.meta.url)('playwright')
const options = { auth: { persistSession: false, autoRefreshToken: false } }
const database = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, options)
const users = Array.from({ length: 2 }, () => ({
  profileId: randomUUID(), username: `v3look_${randomUUID().replaceAll('-', '').slice(0, 12)}`,
  password: randomBytes(24).toString('base64url'), authId: null,
  auth: createClient(process.env.SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, options)
}))
const animeIds = [randomUUID(), randomUUID()]
let browser, actionId, failure, passed = 0
const artifacts = 'test-results/stage4'
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
  return unwrap(await database.from('profiles').select('avatar_preset,display_name,bio,banner_url,favorite_character_anilist_id').eq('id', user.profileId).single())
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
  for (const user of users) {
    const result = unwrap(await database.auth.admin.createUser({ email: user.username + '@ghost.tracker.local', password: user.password, email_confirm: true }))
    user.authId = result.user.id
    unwrap(await database.from('profiles').insert({ id: user.profileId, username: user.username, auth_user_id: user.authId }))
    unwrap(await user.auth.auth.signInWithPassword({ email: user.username + '@ghost.tracker.local', password: user.password }))
  }
  unwrap(await database.from('anime').insert(animeIds.map((id, i) => ({ id, anilist_id: -(Date.now() % 1000000000 + i), title_romaji: 'Etapa 4 Anime ' + i, cover_image: i ? 'https://s4.anilist.co/stage4-missing.jpg' : null }))))
  unwrap(await database.from('profile_favorites').insert([{profile_id: users[0].profileId, anime_id: animeIds[0], position: 2}, {profile_id: users[0].profileId, anime_id: animeIds[1], position: 8}]))
  unwrap(await database.from('profile_pinned_anime').insert({profile_id: users[0].profileId, anime_id: animeIds[1], position: 6}))
  browser = await chromium.launch({ headless: true, executablePath: process.env.STAGE4_BROWSER_PATH })
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage(), errors = []
  page.setDefaultTimeout(20000)
  page.on('pageerror', error => errors.push(error.message))
  page.on('request', request => {
    if (request.method() === 'POST' && request.url() === base + '/profile/settings' && request.headers()['next-action']) actionId = request.headers()['next-action']
  })
  async function settings(target = page) { await target.goto(base + '/profile/settings'); await target.getByRole('heading', { name: 'Foto de perfil', exact: true }).waitFor() }
  async function login(target, user) {
    await target.goto(base)
    await target.getByLabel('Username', { exact: true }).fill(user.username)
    await target.getByLabel('Senha', { exact: true }).fill(user.password)
    await target.getByRole('button', { name: 'Entrar V3', exact: true }).click()
    await target.waitForURL('**/dashboard')
    await settings(target)
  }
  async function saveForm() {
    await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click()
    await page.getByText('Perfil atualizado com sucesso.', { exact: true }).waitFor()
  }
  await check('anonymous owner profile and settings redirect to login', async () => {
    await page.goto(base + '/profile'); assert.equal(new URL(page.url()).pathname, '/')
    await page.goto(base + '/profile/settings')
    assert.equal(new URL(page.url()).pathname, '/')
  })
  await check('predefined gallery chooses, changes, persists and supports keyboard', async () => {
    await login(page, users[0])
    assert.equal(await page.getByRole('button', { name: 'Escolher avatar preto', exact: true }).getAttribute('aria-pressed'), 'true')
    await page.getByRole('button', { name: 'Escolher avatar azul', exact: true }).click()
    await page.getByRole('button', { name: 'Salvar avatar', exact: true }).click()
    await page.getByText('Avatar atualizado.', { exact: true }).waitFor()
    assert.equal((await saved()).avatar_preset, 'blue')
    await page.reload()
    assert.equal(await page.getByRole('button', { name: 'Escolher avatar azul', exact: true }).getAttribute('aria-pressed'), 'true')
    await page.getByRole('button', { name: 'Escolher avatar roxo', exact: true }).focus(); await page.keyboard.press('Enter')
    await page.getByRole('button', { name: 'Salvar avatar', exact: true }).focus(); await page.keyboard.press('Enter')
    await page.getByText('Avatar atualizado.', { exact: true }).waitFor()
    assert.equal((await saved()).avatar_preset, 'purple')
  })
  await check('server and database reject nonexistent presets; anonymous action refused', async () => {
    for (const avatar_preset of ['red', '', 1, 'https://example.com/avatar']) assert.ok((await callAction(context, {avatar_preset})).includes('"code":"INVALID_INPUT"'))
    assert.equal((await saved()).avatar_preset, 'purple')
    const rejected = await database.from('profiles').update({avatar_preset: 'red'}).eq('id', users[0].profileId)
    assert.equal(rejected.error.code, '23514')
    const anon = await browser.newContext()
    assert.ok((await callAction(anon, {avatar_preset:'blue'})).includes('"code":"UNAUTHORIZED"'))
    await anon.close()
  })
  await check('Unicode boundaries are accepted, overflow blocked in UI and on server', async () => {
    await page.getByLabel('Nome de exibição', {exact:true}).fill('😀'.repeat(50))
    await page.getByLabel('Biografia', {exact:true}).fill('😀'.repeat(500))
    await saveForm()
    assert.equal((await saved()).display_name, '😀'.repeat(50))
    assert.equal((await saved()).bio, '😀'.repeat(500))
    await page.getByLabel('Nome de exibição', {exact:true}).fill('😀'.repeat(51))
    await page.getByRole('button', { name: 'Salvar alterações', exact:true }).click()
    await page.getByRole('alert').filter({hasText:'Nome de exibição muito longo'}).waitFor()
    await page.getByLabel('Nome de exibição', {exact:true}).fill('Etapa 4')
    await page.getByLabel('Biografia', {exact:true}).fill('😀'.repeat(501))
    await page.getByRole('button', { name: 'Salvar alterações', exact:true }).click()
    await page.getByRole('alert').filter({hasText:'bio muito longa'}).waitFor()
    for (const input of [{display_name:'😀'.repeat(51)}, {bio:'😀'.repeat(501)}]) assert.ok((await callAction(context,input)).includes('"code":"INVALID_INPUT"'))
  })
  const bio = '<script>window.stage4Unsafe=true</script>\nAnime 😀 e histórias'
  const banner = 'https://stage4.example.test/banner.svg'
  await page.route(banner, route => route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="240"><rect width="800" height="240" fill="#243c58"/></svg>'}))
  await check('settings persist banner/plain text; profile renders avatar, character and ordered collections', async () => {
    await page.getByLabel('Biografia',{exact:true}).fill(bio)
    await page.getByLabel('URL do Banner',{exact:true}).fill(banner)
    await saveForm()
    assert.ok((await callAction(context,{favorite_character_anilist_id:40})).includes('"success":true'))
    await page.goto(base + '/profile')
    await page.getByRole('img',{name:'Avatar roxo',exact:true}).waitFor()
    const bannerImage = page.locator('[aria-label="Banner do perfil"] img')
    await bannerImage.waitFor()
    await eventually(() => bannerImage.evaluate(img => img.complete && img.naturalWidth > 0))
    assert.equal(await bannerImage.getAttribute('src'),banner)
    await page.getByText(bio,{exact:true}).waitFor()
    assert.equal(await page.evaluate(() => window.stage4Unsafe), undefined)
    assert.equal(await page.getByText(bio,{exact:true}).evaluate(el => getComputedStyle(el).whiteSpace), 'pre-wrap')
    await page.getByRole('region',{name:'Personagem favorito',exact:true}).getByText('Luffy Monkey',{exact:true}).waitFor()
    assert.deepEqual(await page.getByRole('region',{name:'Animes favoritos'}).locator('li').evaluateAll(rows => rows.map(row => row.value)),[2,8])
    assert.deepEqual(await page.getByRole('region',{name:'Animes fixados'}).locator('li').evaluateAll(rows => rows.map(row => row.value)),[6])
    mkdirSync(artifacts,{recursive:true})
    await page.screenshot({path:artifacts + '/desktop.png',fullPage:true})
  })
  await check('invalid banner rejected; broken banner and cover safely fall back', async () => {
    for (const banner_url of ['http://example.com/a','javascript:alert(1)','https://']) assert.ok((await callAction(context,{banner_url})).includes('"code":"INVALID_INPUT"'))
    await page.route(banner, route => route.abort('failed'))
    await page.route('**/_next/image?*', route => route.abort('failed'))
    await page.reload()
    await eventually(async () => await page.locator('[aria-label="Banner do perfil"] img').count() === 0)
    assert.equal((await saved()).banner_url,banner)
    await eventually(async () => await page.getByRole('region',{name:'Animes favoritos'}).locator('img').count() === 0)
    assert.equal(await page.getByRole('region',{name:'Animes favoritos'}).locator('a').count(),2)
  })
  await check('failed settings transport restores controls and allows retry without losing input', async () => {
    await settings()
    await page.getByLabel('Biografia',{exact:true}).fill('Depois da falha')
    const failing = async route => {
      if (route.request().method() === 'POST') await route.abort('failed'); else await route.continue()
    }
    await page.route('**/profile/settings',failing)
    await page.getByRole('button',{name:'Salvar alterações',exact:true}).click()
    await page.getByRole('alert').filter({hasText:'Não foi possível confirmar'}).waitFor()
    assert.equal(await page.getByRole('button',{name:'Salvar alterações',exact:true}).isEnabled(),true)
    assert.equal(await page.getByLabel('Biografia',{exact:true}).inputValue(),'Depois da falha')
    assert.equal((await saved()).bio,bio)
    await page.unroute('**/profile/settings',failing)
    await saveForm()
    assert.equal((await saved()).bio,'Depois da falha')
    assert.equal((await saved()).avatar_preset,'purple')
  })
  await check('failed avatar submission keeps selection and allows retry', async () => {
    await page.getByRole('button',{name:'Escolher avatar azul',exact:true}).click()
    const failing = async route => route.request().method() === 'POST' ? route.abort('failed') : route.continue()
    await page.route('**/profile/settings',failing)
    await page.getByRole('button',{name:'Salvar avatar',exact:true}).click()
    await page.getByRole('status').filter({hasText:'Não foi possível confirmar'}).waitFor()
    assert.equal((await saved()).avatar_preset,'purple')
    assert.equal(await page.getByRole('button',{name:'Escolher avatar azul',exact:true}).getAttribute('aria-pressed'),'true')
    await page.unroute('**/profile/settings',failing)
    await page.getByRole('button',{name:'Salvar avatar',exact:true}).click()
    await page.getByText('Avatar atualizado.',{exact:true}).waitFor()
    assert.equal((await saved()).avatar_preset,'blue')
  })
  await check('mobile selection and spoofed identity affect only logged-in account', async () => {
    const mobile = await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})
    const other = await mobile.newPage()
    await login(other,users[1])
    assert.ok((await callAction(mobile,{avatar_preset:'purple',profile_id:users[0].profileId,auth_user_id:users[0].authId})).includes('"success":true'))
    assert.equal((await saved()).avatar_preset,'blue')
    assert.equal((await saved(users[1])).avatar_preset,'purple')
    await other.reload()
    await other.getByRole('button',{name:'Escolher avatar preto',exact:true}).tap()
    await other.getByRole('button',{name:'Salvar avatar',exact:true}).tap()
    await other.getByText('Avatar atualizado.',{exact:true}).waitFor()
    await other.goto(base + '/profile')
    await other.getByRole('img',{name:'Avatar preto',exact:true}).waitFor()
    assert.equal(await other.getByRole('region',{name:'Animes favoritos'}).count(),0)
    assert.equal(await other.evaluate(() => document.documentElement.scrollWidth > innerWidth),false)
    await other.screenshot({path:artifacts + '/mobile-empty.png',fullPage:true})
    await mobile.close()
    await page.setViewportSize({width:390,height:844})
    await page.goto(base + '/profile')
    await page.getByRole('img',{name:'Avatar azul',exact:true}).waitFor()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false)
    await page.screenshot({path:artifacts + '/mobile.png',fullPage:true})
    // Maximum unbroken Unicode name/bio also fit the mobile layout.
    await callAction(context,{display_name:'😀'.repeat(50),bio:'😀'.repeat(500)})
    await page.reload()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false)
  })
  await check('unavailable saved character preserves its ID and profile fallback until removal', async () => {
    unwrap(await database.from('profiles').update({favorite_character_anilist_id:2147483647}).eq('id',users[0].profileId))
    await page.goto(base + '/profile')
    await page.getByRole('region',{name:'Personagem favorito',exact:true}).getByText('Personagem salvo',{exact:false}).waitFor()
    await page.getByText('Os detalhes estão indisponíveis agora.',{exact:true}).waitFor()
    assert.equal((await saved()).favorite_character_anilist_id,2147483647)
  })
  await check('optional fields remove to null; collections and character removal reflected in profile', async () => {
    await settings()
    await page.getByLabel('Nome de exibição',{exact:true}).fill('')
    await page.getByLabel('Biografia',{exact:true}).fill('')
    await page.getByLabel('URL do Banner',{exact:true}).fill('')
    await saveForm()
    const row = await saved()
    assert.equal(row.display_name,null); assert.equal(row.bio,null); assert.equal(row.banner_url,null)
    await page.getByRole('button',{name:'Remover personagem',exact:true}).click()
    await page.getByText('Nenhum personagem escolhido.',{exact:true}).waitFor()
    for (const [title,label] of [['Etapa 4 Anime 0','Favoritos'],['Etapa 4 Anime 1','Favoritos'],['Etapa 4 Anime 1','Animes fixados']]) {
      await page.getByRole('button',{name:'Remover ' + title + ' de ' + label,exact:true}).click()
      await eventually(async () => await page.getByRole('button',{name:'Remover ' + title + ' de ' + label,exact:true}).count() === 0)
    }
    await page.goto(base + '/profile')
    await page.getByRole('heading',{name:users[0].username,exact:true}).waitFor()
    assert.equal(await page.getByRole('region',{name:'Personagem favorito',exact:true}).count(),0)
    assert.equal(await page.getByRole('region',{name:'Animes favoritos',exact:true}).count(),0)
    assert.equal(await page.locator('[aria-label="Banner do perfil"] img').count(),0)
    assert.equal((await saved()).avatar_preset,'blue')
    assert.deepEqual(errors,[])
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
  if ((await database.from('anime').delete().in('id',animeIds)).error) cleanupErrors.push('anime fixtures')
  if (cleanupErrors.length) throw new Error(`Cleanup failure: ${cleanupErrors.join(', ')}`)
}
assert.deepEqual(await snapshot(), before, 'Existing rows must be identical after fixture cleanup')
console.info('PASS cleanup and SHA-256 comparison of every original row')
if (failure) throw failure
console.info(`Personalization browser integration: ${passed + 1} checks passed; fixtures removed; screenshots in ${artifacts}.`)
