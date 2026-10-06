import assert from 'node:assert/strict'
import test from 'node:test'
import { loadServerModule } from './helpers/load-server-module.mjs'

const utilities = loadServerModule('src/lib/profile-anime.ts', {})
const validations = loadServerModule('src/lib/validations/profile.ts', {})
const profileId = '20000000-0000-4000-8000-000000000001'
class AniListError extends Error {
  constructor(message, status) { super(message); this.status = status }
}
const raw = { id: 40, name: { full: 'Monkey D. Luffy' }, image: { large: 'https://s4.anilist.co/character.jpg' } }
function dataHarness({ payload = { data: { Character: raw } }, error = null } = {}) {
  const calls = []
  const data = loadServerModule('src/data/profile-character.ts', {
    'server-only': {},
    '@/lib/anilist/client': { AniListError, fetchAniList: async (...args) => {
      calls.push(args); if (error) throw error; return payload
    } },
    '@/lib/anilist/queries': { SEARCH_CHARACTERS_QUERY: 'search', GET_CHARACTER_BY_ID_QUERY: 'detail' },
    '@/lib/profile-anime': utilities
  })
  return { data, calls }
}

await test('Character resolution validates GraphQL IDs before requesting metadata', async () => {
  const h = dataHarness()
  for (const id of [0, -1, 1.5, '40', null, 2147483648, Infinity]) {
    assert.equal((await h.data.getProfileCharacter(id)).code, 'INVALID_INPUT')
  }
  assert.deepEqual(h.calls, [])
  assert.deepEqual(await h.data.getProfileCharacter(40), { data: { anilist_id: 40, name: raw.name.full, image: raw.image.large } })
  assert.deepEqual(h.calls[0], ['detail', { id: 40 }])
})

await test('Character search normalizes names/images and drops invalid identifiers', async () => {
  const h = dataHarness({ payload: { data: { Page: { characters: [null, { id: -1 }, raw,
    { id: 41, name: { full: '', native: '名前' }, image: { medium: 'https://s4.anilist.co/small.jpg' } },
    { id: 42, image: { large: 'https://untrusted.example/image' } }
  ] } } } })
  assert.deepEqual(await h.data.searchProfileCharacters('luffy'), { results: [
    { anilist_id: 40, name: raw.name.full, image: raw.image.large },
    { anilist_id: 41, name: '名前', image: 'https://s4.anilist.co/small.jpg' },
    { anilist_id: 42, name: 'Personagem sem nome', image: null }
  ] })
})

await test('Empty character results are distinguished from malformed upstream payload', async () => {
  assert.deepEqual(await dataHarness({ payload: { data: { Page: { characters: [] } } } }).data.searchProfileCharacters('absent'), { results: [] })
  assert.equal((await dataHarness({ payload: {} }).data.searchProfileCharacters('absent')).code, 'UPSTREAM_ERROR')
})

await test('Missing/mismatched characters and upstream 404 return NOT_FOUND', async () => {
  for (const options of [{ payload: { data: { Character: null } } }, { payload: { data: { Character: { ...raw, id: 41 } } } }, { error: new AniListError('private', 404) }]) {
    assert.equal((await dataHarness(options).data.getProfileCharacter(40)).code, 'NOT_FOUND')
  }
})

await test('Character API failures are safe and preserve the saved ID in display fallback', async () => {
  for (const error of [new AniListError('secret Timeout'), new AniListError('secret', 429), new Error('private')]) {
    const h = dataHarness({ error })
    const result = await h.data.getProfileCharacter(40)
    assert.equal(result.code, 'UPSTREAM_ERROR')
    assert.equal(/secret|private/.test(result.error), false)
    const display = await h.data.resolveFavoriteCharacter(40)
    assert.equal(display.id, 40)
    assert.equal(display.character, null)
    assert.ok(display.error)
  }
})

await test('No selection requires no lookup; legacy saved ID resolves normally', async () => {
  const h = dataHarness()
  assert.deepEqual(await h.data.resolveFavoriteCharacter(null), { id: null, character: null, error: null })
  assert.equal(h.calls.length, 0)
  const legacy = await h.data.resolveFavoriteCharacter(40)
  assert.equal(legacy.character.anilist_id, 40)
  assert.equal(legacy.error, null)
})

function actionHarness({ session = { profileId }, character = { data: { anilist_id: 40, name: 'Trusted', image: null } }, databaseError = null } = {}) {
  const lookups = [], updates = [], filters = [], paths = []
  const actions = loadServerModule('src/actions/profile.ts', {
    '@/lib/session': { getSession: async () => session },
    '@/data/profile-character': { getProfileCharacter: async (id) => { lookups.push(id); return character } },
    '@/lib/validations/profile': validations,
    '@/data/supabase': { supabaseServerClient: { from(table) {
      assert.equal(table, 'profiles')
      return { update: (value) => { updates.push(value); return { eq: async (...args) => {
        filters.push(args); return { error: databaseError }
      } } } }
    } } },
    'next/cache': { revalidatePath: (path) => paths.push(path) }
  })
  return { actions, lookups, updates, filters, paths }
}

await test('Character mutations authenticate before any external request or database write', async () => {
  const h = actionHarness({ session: null })
  assert.equal((await h.actions.updateProfileSettings({ favorite_character_anilist_id: 40 })).code, 'UNAUTHORIZED')
  assert.deepEqual([h.lookups, h.updates, h.paths], [[], [], []])
})

await test('Invalid character input cannot reach upstream or mutate the database', async () => {
  const h = actionHarness()
  for (const id of [0, -1, 1.5, '40', 2147483648]) assert.equal((await h.actions.updateProfileSettings({ favorite_character_anilist_id: id })).code, 'INVALID_INPUT')
  assert.deepEqual([h.lookups, h.updates], [[], []])
})

await test('Nonexistent or unavailable characters leave saved data unchanged', async () => {
  for (const code of ['NOT_FOUND', 'UPSTREAM_ERROR']) {
    const h = actionHarness({ character: { error: 'Safe failure', code } })
    assert.equal((await h.actions.updateProfileSettings({ favorite_character_anilist_id: 40 })).code, code)
    assert.deepEqual(h.updates, [])
    assert.deepEqual(h.paths, [])
  }
})

await test('Character selection persists only the ID for the session owner and revalidates', async () => {
  const h = actionHarness()
  assert.deepEqual(await h.actions.updateProfileSettings({ favorite_character_anilist_id: 40, profile_id: 'spoofed', name: 'Forged', image: 'forged' }), { success: true })
  assert.deepEqual(h.lookups, [40])
  assert.deepEqual(h.updates, [{ favorite_character_anilist_id: 40 }])
  assert.deepEqual(h.filters, [['id', profileId]])
  assert.deepEqual(h.paths, ['/profile', '/profile/settings', '/user/[username]'])
})

await test('Removal works without AniList; unrelated settings omit character and preserve it', async () => {
  const h = actionHarness()
  await h.actions.updateProfileSettings({ favorite_character_anilist_id: null })
  await h.actions.updateProfileSettings({ bio: 'Updated bio' })
  assert.deepEqual(h.lookups, [])
  assert.deepEqual(h.updates, [{ favorite_character_anilist_id: null }, { bio: 'Updated bio' }])
})

await test('Database failure does not report character success or revalidate', async () => {
  const h = actionHarness({ databaseError: { code: 'TEST_FAILURE' } })
  assert.equal((await h.actions.updateProfileSettings({ favorite_character_anilist_id: 40 })).code, 'INTERNAL_ERROR')
  assert.deepEqual(h.paths, [])
})

await test('Character search route gates identity, normalizes query and has private responses', async () => {
  for (const [session, q, expected] of [[null, 'luffy', 401], [{ profileId }, 'a', 400], [{ profileId }, 'x'.repeat(101), 400], [{ profileId }, ' luffy ', 200]]) {
    const calls = []
    const route = loadServerModule('src/app/api/profile/character-search/route.ts', {
      '@/lib/session': { getSession: async () => session },
      '@/data/profile-character': { searchProfileCharacters: async (query) => { calls.push(query); return { results: [] } } }
    })
    const response = await route.GET(new Request(`https://example.test/api/profile/character-search?q=${encodeURIComponent(q)}`))
    assert.equal(response.status, expected)
    assert.equal(response.headers.get('cache-control'), 'private, no-store')
    assert.deepEqual(calls, expected === 200 ? ['luffy'] : [])
  }
})
