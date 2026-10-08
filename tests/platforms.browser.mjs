import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { randomBytes, randomUUID, createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { setTimeout as delay } from 'node:timers/promises'
import { createClient } from '@supabase/supabase-js'

if (!process.argv.includes('--live')) throw new Error('Use --live for isolated platform tests.')
if (existsSync('.env.local')) process.loadEnvFile('.env.local')
if (existsSync('.env')) process.loadEnvFile('.env')
if (new URL(process.env.SUPABASE_URL).hostname !== 'hhprevdkcvqxikmeolxd.supabase.co') throw new Error('Unexpected project')
const base = process.env.PLATFORMS_BASE_URL || 'http://127.0.0.1:3015'
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('Local server required')
const { chromium } = createRequire(import.meta.url)('playwright')
const options = { auth: { persistSession: false, autoRefreshToken: false } }
const database = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, options)
const anon = createClient(process.env.SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, options)
const tables = ['profiles', 'anime', 'user_anime', 'profile_favorites', 'profile_pinned_anime', 'platforms', 'user_anime_platforms', 'personal_platforms', 'user_anime_personal_platforms']
function unwrap(result) { if (result.error) throw new Error(`Database failure: ${result.error.code}`); return result.data }
async function snapshot() {
  const result = {}
  for (const table of tables) {
    const rows = unwrap(await database.from(table).select('*'))
    result[table] = { count: rows.length, hash: createHash('sha256').update(rows.map(row => JSON.stringify(row)).sort().join('\n')).digest('hex') }
  }
  return result
}
const before = await snapshot(), users = Array.from({ length: 2 }, () => ({
  id: randomUUID(), authId: null, username: `V4P_${randomUUID().replaceAll('-', '').slice(0, 14)}`,
  email: `v4platform_${randomUUID()}@ghost.tracker.local`, password: randomBytes(24).toString('base64url'),
  auth: createClient(process.env.SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, options),
}))
let browser, failure, passed = 0, actionKind
const actions = {}, errors = []
async function check(name, fn) { await fn(); passed++; console.log('PASS', name) }
async function waitDb(fn) { for (let i = 0; i < 50; i++) { if (await fn()) return; await delay(100) } throw new Error('Mutation did not settle') }
try {
  const anime = unwrap(await database.from('anime').select('id, anilist_id').eq('status', 'FINISHED').limit(1).single())
  for (const user of users) {
    user.authId = unwrap(await database.auth.admin.createUser({ email: user.email, password: user.password, email_confirm: true })).user.id
    unwrap(await database.from('profiles').insert({ id: user.id, auth_user_id: user.authId, username: user.username, profile_visibility: 'public' }))
    user.libraryId = unwrap(await database.from('user_anime').insert({ profile_id: user.id, anime_id: anime.id, status: 'completed' }).select('id').single()).id
    unwrap(await user.auth.auth.signInWithPassword({ email: user.email, password: user.password }))
  }
  const foreign = unwrap(await database.from('personal_platforms').insert({ profile_id: users[1].id, name: 'Outra conta particular' }).select('id').single())
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLATFORMS_BROWSER_PATH })
  const owner = await browser.newContext({ viewport: { width: 1280, height: 900 } }), guest = await browser.newContext()
  const page = await owner.newPage(), visitor = await guest.newPage()
  page.setDefaultTimeout(25000); visitor.setDefaultTimeout(25000)
  page.on('pageerror', error => errors.push(error.message))
  page.on('request', request => { if (actionKind && request.method() === 'POST' && request.headers()['next-action']) actions[actionKind] = request.headers()['next-action'] })
  async function login(target) {
    await target.goto(base + '/login'); await target.getByLabel('Username', { exact: true }).fill(users[0].username)
    await target.getByLabel('Senha', { exact: true }).fill(users[0].password)
    await target.getByRole('button', { name: 'Entrar', exact: true }).click(); await target.waitForURL('**/dashboard')
  }
  const animeUrl = `${base}/anime/${anime.anilist_id}`
  const personal = page.getByRole('region', { name: 'Plataformas particulares', exact: true })
  let platformId
  await check('create private platform, normalize URL, persist after reload', async () => {
    await login(page); await page.goto(animeUrl); await personal.waitFor()
    assert.equal(await personal.getByText('Outra conta particular', { exact: true }).count(), 0)
    await personal.getByRole('button', { name: 'Criar plataforma', exact: true }).click()
    await page.getByLabel('Nome da plataforma', { exact: true }).fill('  Minha plataforma V4  ')
    await page.getByLabel('Link da plataforma (opcional)', { exact: true }).fill('https://example.com/animes')
    actionKind = 'save'; await personal.getByRole('button', { name: 'Salvar plataforma', exact: true }).click()
    await personal.getByText('Plataforma salva.', { exact: true }).waitFor(); actionKind = null
    const saved = unwrap(await database.from('personal_platforms').select('*').eq('profile_id', users[0].id).single())
    platformId = saved.id; assert.equal(saved.name, 'Minha plataforma V4'); assert.equal(saved.website_url, 'https://example.com/animes')
    await page.reload(); await personal.getByRole('checkbox', { name: 'Minha plataforma V4', exact: true }).waitFor()
  })
  await check('associate and remove platform; selection persists in another browser session', async () => {
    actionKind = 'select'; await personal.getByRole('checkbox', { name: 'Minha plataforma V4', exact: true }).check()
    await personal.getByText('Escolha de plataforma atualizada.', { exact: true }).waitFor(); actionKind = null
    await waitDb(async () => unwrap(await database.from('user_anime_personal_platforms').select('*').eq('profile_id', users[0].id)).length === 1)
    const second = await browser.newContext(), secondPage = await second.newPage(); await login(secondPage); await secondPage.goto(animeUrl)
    assert.equal(await secondPage.getByRole('checkbox', { name: 'Minha plataforma V4', exact: true }).isChecked(), true); await second.close()
    await personal.getByRole('checkbox', { name: 'Minha plataforma V4', exact: true }).uncheck()
    await waitDb(async () => unwrap(await database.from('user_anime_personal_platforms').select('*').eq('profile_id', users[0].id)).length === 0)
  })
  await check('edit, discard and duplicate name validation preserve records', async () => {
    await personal.getByRole('button', { name: 'Editar Minha plataforma V4', exact: true }).click()
    await page.getByLabel('Nome da plataforma', { exact: true }).fill('Alterado V4')
    await page.getByLabel('Link da plataforma (opcional)', { exact: true }).fill('')
    await personal.getByRole('button', { name: 'Salvar plataforma', exact: true }).click(); await personal.getByText('Plataforma salva.', { exact: true }).waitFor()
    assert.equal(unwrap(await database.from('personal_platforms').select('website_url').eq('id', platformId).single()).website_url, null)
    await personal.getByRole('button', { name: 'Editar Alterado V4', exact: true }).click(); await page.getByLabel('Nome da plataforma', { exact: true }).fill('Descartado')
    await personal.getByRole('button', { name: 'Cancelar edição', exact: true }).click(); assert.equal(await personal.getByText('Descartado', { exact: true }).count(), 0)
    await personal.getByRole('button', { name: 'Criar plataforma', exact: true }).click(); await page.getByLabel('Nome da plataforma', { exact: true }).fill('alterado v4')
    await personal.getByRole('button', { name: 'Salvar plataforma', exact: true }).click(); await personal.getByRole('alert').getByText('Você já tem uma plataforma com esse nome.', { exact: true }).waitFor()
    await personal.getByRole('button', { name: 'Cancelar edição', exact: true }).click()
  })
  async function callAction(context, kind, args) {
    assert.ok(actions[kind]); const response = await context.request.post(animeUrl, { headers: { 'next-action': actions[kind], origin: base, 'content-type': 'text/plain;charset=UTF-8' }, data: JSON.stringify(args) })
    assert.equal(response.status(), 200); return response.text()
  }
  await check('forged owner, foreign-platform association and anonymous actions are rejected', async () => {
    assert.ok((await callAction(owner, 'save', [{ name: 'forged', profile_id: users[1].id }])).includes('Dados de plataforma inválidos.'))
    assert.ok((await callAction(owner, 'save', [{ name: 'forged' }, foreign.id])).includes('Plataforma não encontrada.'))
    assert.ok((await callAction(owner, 'select', [anime.anilist_id, foreign.id, true])).includes('Plataforma não encontrada.'))
    assert.ok((await callAction(guest, 'save', [{ name: 'forged' }])).includes('Não autorizado.'))
    for (const client of [anon, users[0].auth, users[1].auth]) for (const table of ['personal_platforms', 'user_anime_personal_platforms']) assert.equal((await client.from(table).select('*')).error?.code, '42501')
    assert.equal(unwrap(await database.from('personal_platforms').select('name').eq('id', foreign.id).single()).name, 'Outra conta particular')
  })
  await check('database rejects cross-owner joins; public profile and library omit personal platforms', async () => {
    for (const input of [
      { profile_id: users[0].id, user_anime_id: users[0].libraryId, personal_platform_id: foreign.id },
      { profile_id: users[0].id, user_anime_id: users[1].libraryId, personal_platform_id: platformId },
    ]) assert.equal((await database.from('user_anime_personal_platforms').insert(input)).error?.code, '23503')
    for (const rpc of ['read_public_profile', 'read_public_library']) {
      const payload = JSON.stringify(unwrap(await anon.rpc(rpc, { p_username: users[0].username })))
      for (const secret of [platformId, foreign.id, 'Alterado V4', 'Outra conta particular', 'example.com/animes']) assert.equal(payload.includes(secret), false)
    }
    await visitor.goto(`${base}/user/${users[0].username}`); assert.equal((await visitor.content()).includes('Alterado V4'), false)
  })
  await check('mobile layout and official/personal distinction remain readable', async () => {
    await page.setViewportSize({ width: 320, height: 850 }); await page.goto(animeUrl); await personal.waitFor()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
    await page.getByRole('region', { name: 'Serviços oficiais', exact: true }).getByText(/disponibilidade no Brasil não foi confirmada/).waitFor()
    await page.getByText('Onde eu assisto', { exact: true }).waitFor()
    for (const link of await page.getByRole('region', { name: 'Serviços oficiais', exact: true }).getByRole('link').all()) {
      assert.ok((await link.getAttribute('href')).startsWith('https://')); assert.equal(await link.getAttribute('rel'), 'noopener noreferrer')
    }
  })
  await check('delete requires confirmation, cascades associations and rejects foreign deletion', async () => {
    await personal.getByRole('checkbox', { name: 'Alterado V4', exact: true }).check(); await personal.getByText('Escolha de plataforma atualizada.', { exact: true }).waitFor()
    await personal.getByRole('button', { name: 'Excluir Alterado V4', exact: true }).click()
    await personal.getByRole('button', { name: 'Cancelar exclusão', exact: true }).click(); assert.ok(unwrap(await database.from('personal_platforms').select('id').eq('id', platformId).single()))
    await personal.getByRole('button', { name: 'Excluir Alterado V4', exact: true }).click()
    actionKind = 'delete'; await personal.getByRole('button', { name: 'Confirmar exclusão', exact: true }).click(); await personal.getByText('Plataforma excluída.', { exact: true }).waitFor(); actionKind = null
    assert.equal(unwrap(await database.from('personal_platforms').select('id').eq('id', platformId)).length, 0)
    assert.equal(unwrap(await database.from('user_anime_personal_platforms').select('*').eq('profile_id', users[0].id)).length, 0)
    assert.ok((await callAction(owner, 'delete', [foreign.id])).includes('Plataforma não encontrada.'))
  })
  assert.deepEqual(errors, [])
} catch (error) { failure = error }
finally {
  await browser?.close()
  for (const user of users) {
    await user.auth.auth.signOut()
    unwrap(await database.from('profiles').delete().eq('id', user.id))
    if (user.authId) unwrap(await database.auth.admin.deleteUser(user.authId))
  }
  assert.deepEqual(await snapshot(), before, 'Original records must remain unchanged')
}
if (failure) throw failure
console.log(`${passed} platform browser checks passed; isolated fixtures removed and original records preserved.`)
