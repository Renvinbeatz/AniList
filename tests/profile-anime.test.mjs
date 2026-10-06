import assert from 'node:assert/strict'
import test from 'node:test'
import { loadServerModule } from './helpers/load-server-module.mjs'

const utilities = loadServerModule('src/lib/profile-anime.ts', {})
const profileId = '20000000-0000-4000-8000-000000000001'
const animeId = '10000000-0000-4000-8000-000000000001'

function actionHarness({ session = { profileId }, rows = [], error = null, resolved = { animeId } } = {}) {
  const calls = []
  const action = loadServerModule('src/actions/profile-collections.ts', {
    '@/lib/session': { getSession: async () => session },
    '@/data/supabase': { supabaseServerClient: { from(table) {
      calls.push({ table })
      return { select: () => ({ eq: async (column, value) => {
        calls.push({ column, value }); return { data: rows, error }
      } }) }
    } } },
    '@/data/profile-anime': { resolveProfileAnime: async (id) => { calls.push({ resolve: id }); return resolved } },
    '@/lib/profile-anime': utilities,
    '@/actions/profile': {
      addProfileFavorite: async (...args) => { calls.push({ favorites: args }); return { success: true } },
      addProfilePinnedAnime: async (...args) => { calls.push({ pinned: args }); return { success: true } }
    }
  })
  return { action: action.addCollectionAnime, calls }
}

await test('Selection action authenticates before any catalogue or collection access', async () => {
  const h = actionHarness({ session: null })
  assert.equal((await h.action('favorites', 1, 1)).code, 'UNAUTHORIZED')
  assert.deepEqual(h.calls, [])
})

await test('Selection rejects malformed IDs, unknown collection and invalid positions without effects', async () => {
  for (const args of [['other', 1, 1], ['favorites', 0, 1], ['favorites', 2147483648, 1], ['favorites', '1', 1],
    ['favorites', 1.5, 1], ['favorites', null, 1], ['favorites', 1, 11], ['pinned', 1, 7], ['favorites', 1, 0], ['pinned', 1, 1.5]]) {
    const h = actionHarness()
    assert.equal((await h.action(...args)).code, 'INVALID_INPUT')
    assert.deepEqual(h.calls, [])
  }
})

await test('Duplicate anime, occupied slot and collection read failures skip catalogue writes', async () => {
  for (const [options, code] of [
    [{ rows: [{ position: 2, anime: { anilist_id: 1 } }] }, 'ALREADY_EXISTS'],
    [{ rows: [{ position: 1, anime: { anilist_id: 2 } }] }, 'POSITION_CONFLICT'],
    [{ error: { code: 'FAIL' } }, 'INTERNAL_ERROR']
  ]) {
    const h = actionHarness(options)
    assert.equal((await h.action('favorites', 1, 1)).code, code)
    assert.equal(h.calls.some((call) => 'resolve' in call), false)
  }
})

await test('Only session ownership is read, only AniList ID is resolved, both collections use Stage 1 mutations', async () => {
  for (const kind of ['favorites', 'pinned']) {
    const h = actionHarness()
    assert.deepEqual(await h.action(kind, 123, 1, { profile_id: 'spoofed', title: 'forged' }), { success: true })
    assert.deepEqual(h.calls, [
      { table: kind === 'favorites' ? 'profile_favorites' : 'profile_pinned_anime' },
      { column: 'profile_id', value: profileId }, { resolve: 123 }, { [kind]: [animeId, 1] }
    ])
  }
})

await test('Upstream resolution failure is returned without collection mutation', async () => {
  const result = { error: 'Try later', code: 'UPSTREAM_ERROR' }
  const h = actionHarness({ resolved: result })
  assert.deepEqual(await h.action('favorites', 1, 1), result)
  assert.equal(h.calls.some((call) => 'favorites' in call), false)
})

class AniListError extends Error {
  constructor(message, status) { super(message); this.status = status }
}
function dataHarness({ local = null, insertion = { id: animeId }, concurrent = null, upstreamError = null,
  payload = { data: { Media: { id: 123, title: { romaji: 'Trusted title' }, coverImage: { large: 'https://s4.anilist.co/trusted.jpg' } } } } } = {}) {
  const calls = []
  let reads = 0
  const data = loadServerModule('src/data/profile-anime.ts', {
    'server-only': {},
    '@/data/supabase': { supabaseServerClient: { from(table) {
      assert.equal(table, 'anime', 'Never access the user library')
      return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: reads++ === 0 ? local : concurrent, error: null }) }) }),
        upsert: (record, options) => {
          calls.push({ record, options })
          return { select: () => ({ maybeSingle: async () => ({ data: insertion, error: null }) }) }
        }
      }
    } } },
    '@/lib/anilist/client': { AniListError, fetchAniList: async (...args) => {
      calls.push({ fetch: args }); if (upstreamError) throw upstreamError; return payload
    } },
    '@/lib/anilist/queries': { SEARCH_ANIME_QUERY: 'search', GET_ANIME_BY_ID_QUERY: 'detail' },
    '@/lib/anilist/normalize': loadServerModule('src/lib/anilist/normalize.ts', {}),
    '@/lib/profile-anime': utilities
  })
  return { data, calls }
}

await test('Existing catalogue records are reused without AniList request or overwrite', async () => {
  const h = dataHarness({ local: { id: animeId } })
  assert.deepEqual(await h.data.resolveProfileAnime(123), { animeId })
  assert.deepEqual(h.calls, [])
})

await test('New catalogue metadata comes from AniList; racing inserts reuse the winner without overwriting', async () => {
  const h = dataHarness({ insertion: null, concurrent: { id: animeId } })
  assert.deepEqual(await h.data.resolveProfileAnime(123), { animeId })
  assert.equal(h.calls[0].fetch[1].id, 123)
  assert.equal(h.calls[1].record.title_romaji, 'Trusted title')
  assert.equal(h.calls[1].record.cover_image, 'https://s4.anilist.co/trusted.jpg')
  assert.deepEqual(h.calls[1].options, { onConflict: 'anilist_id', ignoreDuplicates: true })
})

await test('Missing or mismatched AniList media never gets persisted', async () => {
  for (const payload of [{ data: { Media: null } }, { data: { Media: { id: 456 } } }]) {
    const h = dataHarness({ payload })
    assert.equal((await h.data.resolveProfileAnime(123)).code, 'NOT_FOUND')
    assert.equal(h.calls.some((call) => 'record' in call), false)
  }
})

await test('Search handles empty results, drops invalid IDs and returns only safe display data', async () => {
  const h = dataHarness({ payload: { data: { Page: { media: [null, { id: 0 }, { id: 123, title: { english: 'Title' }, coverImage: { large: 'https://evil.example/image' } }] } } } })
  assert.deepEqual(await h.data.searchProfileAnime('title'), { results: [{ anilist_id: 123, title: 'Title', cover_image: null, year: null }] })
  assert.deepEqual(await dataHarness({ payload: { data: { Page: { media: [] } } } }).data.searchProfileAnime('absent'), { results: [] })
})

await test('Timeout, rate-limit and invalid upstream payload return safe errors', async () => {
  for (const error of [new AniListError('secret Timeout'), new AniListError('secret rate limit', 429), new Error('private upstream')]) {
    const h = dataHarness({ upstreamError: error })
    const result = await h.data.searchProfileAnime('naruto')
    assert.equal(result.code, 'UPSTREAM_ERROR')
    assert.equal(/secret|private/.test(result.error), false)
    assert.equal((await h.data.resolveProfileAnime(123)).code, 'UPSTREAM_ERROR')
  }
  assert.equal((await dataHarness({ payload: {} }).data.searchProfileAnime('x')).code, 'UPSTREAM_ERROR')
})

await test('Search route requires real authorization and validates query before upstream work', async () => {
  for (const [session, query, status] of [[null, 'naruto', 401], [{ profileId }, 'a', 400], [{ profileId }, 'a'.repeat(101), 400], [{ profileId }, '  naruto  ', 200]]) {
    const calls = []
    const route = loadServerModule('src/app/api/profile/anime-search/route.ts', {
      '@/lib/session': { getSession: async () => session },
      '@/data/profile-anime': { searchProfileAnime: async (q) => { calls.push(q); return { results: [] } } }
    })
    const response = await route.GET(new Request(`https://example.test/api/profile/anime-search?q=${encodeURIComponent(query)}`))
    assert.equal(response.status, status)
    assert.equal(response.headers.get('cache-control'), 'private, no-store')
    assert.deepEqual(calls, status === 200 ? ['naruto'] : [])
  }
})
