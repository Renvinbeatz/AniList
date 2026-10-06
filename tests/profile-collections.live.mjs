import assert from 'node:assert/strict'
import { randomUUID, randomInt, randomBytes, createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { loadServerModule } from './helpers/load-server-module.mjs'

// Explicit opt-in: creates isolated fixtures in the official project, always cleans
// them up, and never updates an existing profile, anime, or library relation.
if (!process.argv.includes('--live')) throw new Error('Pass --live to run the isolated database integration tests.')
if (existsSync('.env.local')) process.loadEnvFile('.env.local')
if (existsSync('.env')) process.loadEnvFile('.env')
const url = process.env.SUPABASE_URL
if (new URL(url).hostname !== 'hhprevdkcvqxikmeolxd.supabase.co') {
  throw new Error('Unexpected project: refusing to create test fixtures.')
}
const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } }
const database = createClient(url, process.env.SUPABASE_SECRET_KEY, clientOptions)
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const anonymous = createClient(url, publicKey, clientOptions)
const authClients = [createClient(url, publicKey, clientOptions), createClient(url, publicKey, clientOptions)]
let currentAuth = anonymous
const invalidatedPaths = []
const sessions = loadServerModule('src/lib/session.ts', {
  '@/utils/supabase/server': { createClient: async () => currentAuth },
  '@/data/supabase': { supabaseServerClient: database },
  react: { cache: (fn) => fn } // Each call represents a separate request.
})
const actions = loadServerModule('src/actions/profile.ts', {
  '@/data/supabase': { supabaseServerClient: database },
  '@/lib/session': sessions,
  '@/data/profile-character': {},
  '@/lib/validations/profile': loadServerModule('src/lib/validations/profile.ts', {}),
  'next/cache': { revalidatePath: (path) => invalidatedPaths.push(path) }
})

const tag = `v3stage1_${randomUUID().replaceAll('-', '').slice(0, 12)}`
const profileIds = [randomUUID(), randomUUID()]
const animeIds = Array.from({ length: 11 }, () => randomUUID())
const authIds = []
const animeBase = -randomInt(10000000, 2000000000)
let passed = 0

function unwrap(result) {
  if (result.error) throw new Error(`Database operation failed (${result.error.code ?? 'unknown'}).`)
  return result.data
}
async function check(name, fn) {
  await fn()
  passed++
  console.info(`PASS ${name}`)
}
async function snapshot() {
  const tables = ['profiles', 'anime', 'user_anime', 'profile_favorites', 'profile_pinned_anime']
  const result = {}
  for (const table of tables) {
    const rows = unwrap(await database.from(table).select('*'))
    const normalized = rows.map((row) => JSON.stringify(row)).sort().join('\n')
    result[table] = { count: rows.length, hash: createHash('sha256').update(normalized).digest('hex') }
  }
  return result
}
async function collection(kind, profile = profileIds[0]) {
  const table = kind === 'favorites' ? 'profile_favorites' : 'profile_pinned_anime'
  return unwrap(await database.from(table).select('anime_id, position').eq('profile_id', profile).order('position'))
}
async function rpc(kind, operation, anime, position, profile = profileIds[0]) {
  return unwrap(await database.rpc('mutate_profile_collection', {
    p_profile_id: profile, p_collection: kind, p_operation: operation, p_anime_id: anime,
    ...(position === undefined ? {} : { p_position: position })
  }))
}
const before = await snapshot()
let testFailure
try {
  // Auth users, profiles, and anime are all new, identified by this run's random IDs.
  for (let index = 0; index < 2; index++) {
    const email = `${tag}_${index}@ghost.tracker.local`
    const password = randomBytes(24).toString('base64url')
    const user = unwrap(await database.auth.admin.createUser({ email, password, email_confirm: true }))
    authIds.push(user.user.id)
    unwrap(await database.from('profiles').insert({ id: profileIds[index], username: `${tag}_${index}`, auth_user_id: user.user.id }))
    unwrap(await authClients[index].auth.signInWithPassword({ email, password }))
  }
  unwrap(await database.from('anime').insert(animeIds.map((id, index) => ({
    id, anilist_id: animeBase - index, title_romaji: `${tag}_anime_${index}`
  }))))

  await check('unauthenticated real Auth session rejects reads and all six mutations', async () => {
    currentAuth = anonymous
    for (const method of ['addProfileFavorite', 'removeProfileFavorite', 'reorderProfileFavorite', 'addProfilePinnedAnime', 'removeProfilePinnedAnime', 'reorderProfilePinnedAnime']) {
      assert.equal((await actions[method](animeIds[0], 1)).code, 'UNAUTHORIZED')
    }
    assert.equal((await actions.getProfileCollections()).code, 'UNAUTHORIZED')
    assert.equal(invalidatedPaths.length, 0)
  })

  await check('anonymous and authenticated clients cannot call the identity-taking RPC', async () => {
    for (const client of [anonymous, authClients[0]]) {
      const result = await client.rpc('mutate_profile_collection', {
        p_profile_id: profileIds[1], p_collection: 'favorites', p_operation: 'add', p_anime_id: animeIds[0], p_position: 1
      })
      assert.ok(result.error)
      assert.ok(['42501', 'PGRST202'].includes(result.error.code), `Unexpected denial: ${result.error.code}`)
    }
    assert.equal((await collection('favorites', profileIds[1])).length, 0)
  })

  currentAuth = authClients[0]
  await check('real getSession resolves the signed-in user to the expected domain profile', async () => {
    assert.deepEqual(await sessions.getSession(), { profileId: profileIds[0] })
    assert.deepEqual(await actions.getProfileCollections(), { data: { favorites: [], pinned: [] } })
  })

  for (const [kind, limit, add, remove, reorder] of [
    ['favorites', 10, 'addProfileFavorite', 'removeProfileFavorite', 'reorderProfileFavorite'],
    ['pinned', 6, 'addProfilePinnedAnime', 'removeProfilePinnedAnime', 'reorderProfilePinnedAnime']
  ]) {
    await check(`${kind}: fills every slot through real Server Action code and PostgreSQL`, async () => {
      for (let position = 1; position <= limit; position++) {
        assert.deepEqual(await actions[add](animeIds[position - 1], position), { success: true })
      }
      assert.equal((await collection(kind)).length, limit)
    })
    await check(`${kind}: rejects duplicate, occupied position and nonexistent anime`, async () => {
      assert.equal((await actions[add](animeIds[0], limit)).code, 'ALREADY_EXISTS')
      assert.equal((await actions[add](animeIds[10], limit)).code, 'POSITION_CONFLICT')
      assert.equal((await actions[add](randomUUID(), 1)).code, 'NOT_FOUND')
    })
    await check(`${kind}: rejects invalid positions before RPC; database also enforces its limit`, async () => {
      for (const position of [0, -1, limit + 1, 1.5, Infinity]) {
        assert.equal((await actions[reorder](animeIds[0], position)).code, 'INVALID_INPUT')
      }
      assert.equal(await rpc(kind, 'reorder', animeIds[0], limit + 1), 'INVALID_INPUT')
      assert.equal(await rpc(kind, 'reorder', animeIds[0]), 'INVALID_INPUT')
    })
    await check(`${kind}: swaps first and last slot of a full list without losing an item`, async () => {
      const original = await collection(kind)
      assert.deepEqual(await actions[reorder](animeIds[0], limit), { success: true })
      const rows = await collection(kind)
      assert.equal(rows.length, limit)
      assert.equal(rows[0].anime_id, animeIds[limit - 1])
      assert.equal(rows.at(-1).anime_id, animeIds[0])
      assert.deepEqual(rows.map((row) => row.anime_id).sort(), original.map((row) => row.anime_id).sort())
      assert.deepEqual(await actions[reorder](animeIds[0], limit), { success: true })
    })
    await check(`${kind}: deletion leaves a gap and movement into that gap preserves other positions`, async () => {
      assert.deepEqual(await actions[remove](animeIds[0]), { success: true })
      const original = await collection(kind)
      assert.equal(original.some((row) => row.position === limit), false)
      assert.deepEqual(await actions[reorder](animeIds[limit - 1], limit), { success: true })
      const rows = await collection(kind)
      assert.equal(rows.find((row) => row.anime_id === animeIds[limit - 1]).position, limit)
      for (const row of original.filter((row) => row.anime_id !== animeIds[limit - 1])) {
        assert.deepEqual(rows.find((item) => item.anime_id === row.anime_id), row)
      }
      assert.deepEqual(await actions[add](animeIds[0], 1), { success: true })
    })
    await check(`${kind}: missing source fails; concurrent swaps serialize and preserve full list`, async () => {
      assert.equal((await actions[remove](animeIds[10])).code, 'NOT_FOUND')
      assert.equal((await actions[reorder](animeIds[10], 1)).code, 'NOT_FOUND')
      const original = await collection(kind)
      // Each raw RPC is an independent HTTP request/transaction.
      const outcomes = await Promise.all([rpc(kind, 'reorder', animeIds[0], limit), rpc(kind, 'reorder', animeIds[limit - 1], limit)])
      assert.deepEqual(outcomes, ['OK', 'OK'])
      // The second operation may be a no-op depending on scheduling; uniqueness and
      // membership must hold for either valid serialized ordering.
      const rows = await collection(kind)
      assert.equal(rows.length, limit)
      assert.equal(new Set(rows.map((row) => row.position)).size, limit)
      assert.deepEqual(rows.map((row) => row.anime_id).sort(), original.map((row) => row.anime_id).sort())
    })
  }

  await check('competing inserts into one free slot produce one winner and one conflict', async () => {
    const rows = await collection('favorites')
    const occupant = rows.find((row) => row.position === 5).anime_id
    assert.equal(await rpc('favorites', 'remove', occupant), 'OK')
    const outcomes = await Promise.all([rpc('favorites', 'add', occupant, 5), rpc('favorites', 'add', animeIds[10], 5)])
    assert.deepEqual(outcomes.sort(), ['OK', 'POSITION_CONFLICT'])
    assert.equal((await collection('favorites')).length, 10)
  })

  await check('collection reads are sorted and contain no ownership identifiers', async () => {
    const result = await actions.getProfileCollections()
    assert.ok(result.data)
    for (const kind of ['favorites', 'pinned']) {
      assert.equal(result.data[kind].length, kind === 'favorites' ? 10 : 6)
      assert.deepEqual(result.data[kind].map((row) => row.position), [...result.data[kind].map((row) => row.position)].sort((a, b) => a - b))
      assert.equal(JSON.stringify(result.data[kind]).includes('profile_id'), false)
      assert.equal(JSON.stringify(result.data[kind]).includes('auth_user_id'), false)
      assert.ok(result.data[kind].every((row) => row.anime.title_romaji.startsWith(tag)))
    }
  })

  await check('second real account cannot read, remove or reorder the first account collection', async () => {
    const original = await collection('favorites')
    const originalPinned = await collection('pinned')
    currentAuth = authClients[1]
    assert.deepEqual(await actions.getProfileCollections(), { data: { favorites: [], pinned: [] } })
    for (const method of ['removeProfileFavorite', 'reorderProfileFavorite', 'removeProfilePinnedAnime', 'reorderProfilePinnedAnime']) {
      assert.equal((await actions[method](animeIds[0], 1, profileIds[0])).code, 'NOT_FOUND')
    }
    assert.deepEqual(await actions.addProfileFavorite(animeIds[0], 1, profileIds[0]), { success: true })
    assert.deepEqual(await collection('favorites'), original)
    assert.deepEqual(await collection('pinned'), originalPinned)
    assert.equal((await collection('favorites', profileIds[1])).length, 1)
  })

  await check('successful actions revalidate private and public profile routes', async () => {
    assert.ok(invalidatedPaths.length > 0)
    for (let index = 0; index < invalidatedPaths.length; index += 3) {
      assert.deepEqual(invalidatedPaths.slice(index, index + 3), ['/profile', '/profile/settings', '/user/[username]'])
    }
  })
} catch (error) {
  testFailure = error
} finally {
  const cleanupFailures = []
  for (const [index, id] of profileIds.entries()) {
    const result = await database.from('profiles').delete().eq('id', id).eq('username', `${tag}_${index}`)
    if (result.error) cleanupFailures.push('profile')
  }
  for (const client of authClients) {
    const result = await client.auth.signOut()
    if (result.error) cleanupFailures.push('session')
  }
  for (const id of authIds) {
    const result = await database.auth.admin.deleteUser(id)
    if (result.error) cleanupFailures.push('auth user')
  }
  const result = await database.from('anime').delete().in('id', animeIds).lt('anilist_id', 0)
  if (result.error) cleanupFailures.push('anime')
  if (cleanupFailures.length) throw new Error(`Fixture cleanup failed: ${cleanupFailures.join(', ')}`)
}

assert.deepEqual(await snapshot(), before, 'All existing rows must be identical after fixture cleanup.')
console.info('PASS fixture cleanup and complete before/after data comparison')
if (testFailure) throw testFailure
console.info(`Live integration: ${passed + 1} checks passed; all temporary fixtures removed.`)
