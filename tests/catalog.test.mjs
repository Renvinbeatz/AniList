import assert from 'node:assert/strict'
import test from 'node:test'
import { loadServerModule } from './helpers/load-server-module.mjs'

const catalog = loadServerModule('src/lib/catalog.ts', {})
const validation = loadServerModule('src/lib/validations/catalog.ts', { '@/lib/catalog': catalog })
const animeId = '10000000-0000-4000-8000-000000000001'
const baseDraft = { title: 'Uma obra', format: 'TV', status: 'FINISHED' }
const row = { id: animeId, title_romaji: 'Naruto', title_english: 'Naruto', title_native: 'ナルト',
  cover_image: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/test.jpg', season_year: 2002,
  format: 'TV', status: 'FINISHED', episodes: 220, description: 'Legacy text',
  banner_image: null, duration: 23, genres: ['Action'], anilist_id: 20 }

test('Catalogue identity is a local UUID; external numeric IDs are not accepted', () => {
  assert.equal(catalog.isCatalogId(animeId), true)
  assert.equal(catalog.isCatalogId(animeId.toUpperCase()), true)
  for (const id of [20, '20', null, '', 'not-a-uuid', '10000000-0000-0000-0000-000000000001']) {
    assert.equal(catalog.isCatalogId(id), false)
  }
})

test('Search validates Unicode length, rejects controls and treats wildcard characters literally', () => {
  assert.deepEqual(catalog.validateCatalogQuery('  ナルト  '), { query: 'ナルト' })
  assert.deepEqual(catalog.validateCatalogQuery('😺'.repeat(100)), { query: '😺'.repeat(100) })
  for (const value of [null, 20, '', 'a', '😺'.repeat(101), 'nar\u0000uto', 'na\nru']) {
    assert.equal(catalog.validateCatalogQuery(value).code, 'INVALID_INPUT')
  }
  assert.equal(catalog.catalogSearchPattern('100%_\\'), '%100\\%\\_\\\\%')
})

test('Editorial drafts require no provider ID and whitelist only content fields', () => {
  const result = validation.validateCatalogDraft({ ...baseDraft, id: 'forged', anilist_id: 20,
    profile_id: 'forged', approved_by: 'forged', published: true, title: '  Uma obra  ' })
  assert.deepEqual(result.data, { title: 'Uma obra', title_english: null, title_native: null,
    description: null, format: 'TV', status: 'FINISHED', episodes: null, duration: null,
    year: null, genres: null, source_url: null, rights_note: null })
})

test('Empty optional values become null; text and provenance are not treated as markup or licence approval', () => {
  const result = validation.validateCatalogDraft({ ...baseDraft, description: '  <b>Texto</b>  ',
    title_english: ' ', title_native: '', episodes: '', genres: [' ', 'Ação', ' ação ', 'Drama'],
    source_url: ' https://example.org/work ', rights_note: ' Revisão pendente ' })
  assert.equal(result.data.description, '<b>Texto</b>')
  assert.equal(result.data.title_english, null)
  assert.equal(result.data.episodes, null)
  assert.deepEqual(result.data.genres, ['Ação', 'Drama'])
  assert.equal(result.data.source_url, 'https://example.org/work')
  assert.equal(result.data.rights_note, 'Revisão pendente')
  assert.equal('published' in result.data, false)
})

test('Draft validation covers required fields, Unicode limits, enums and malformed input', () => {
  for (const input of [null, [], 1, {}, { ...baseDraft, title: ' ' },
    { ...baseDraft, title: 1 }, { ...baseDraft, title: '😺'.repeat(201) },
    { ...baseDraft, description: '\u0000' }, { ...baseDraft, description: 'a'.repeat(5001) },
    { ...baseDraft, format: 'unknown' }, { ...baseDraft, status: 'watching' }]) {
    assert.equal(validation.validateCatalogDraft(input).code, 'INVALID_INPUT')
  }
  assert.equal(validation.validateCatalogDraft({ ...baseDraft, title: '😺'.repeat(200) }).data.title.length, 400)
})

test('Numeric fields reject coercion, fractions and out-of-range values while supporting unknown counts', () => {
  for (const [field, values] of [['episodes', [0, -1, 1.5, '12', Infinity, 2147483648]],
    ['duration', [0, -1, 1441, true]], ['year', [1899, 2201, 2000.1]]]) {
    for (const value of values) {
      const result = validation.validateCatalogDraft({ ...baseDraft, [field]: value })
      assert.equal(result.code, 'INVALID_INPUT')
      assert.equal(result.field, field)
    }
  }
  assert.equal(validation.validateCatalogDraft({ ...baseDraft, episodes: 220, duration: 23, year: 2002 }).data.episodes, 220)
  assert.equal(validation.validateCatalogDraft({ ...baseDraft, episodes: null }).data.episodes, null)
})

test('Provenance URLs and genres are validated without claiming ownership of artwork', () => {
  for (const source_url of ['http://example.org', 'javascript:alert(1)', 'https://user:password@example.org', 'not a URL']) {
    assert.equal(validation.validateCatalogDraft({ ...baseDraft, source_url }).field, 'source_url')
  }
  for (const genres of ['Action', [1], ['a'.repeat(41)], ['A\nB'], Array(11).fill('Action')]) {
    assert.equal(validation.validateCatalogDraft({ ...baseDraft, genres }).field, 'genres')
  }
  assert.equal(validation.validateCatalogDraft({ ...baseDraft, genres: [] }).data.genres, null)
})

function readerHarness({ rows = [[row], [row], []], detail = row, failedColumn = null, throws = false } = {}) {
  const calls = []
  const data = loadServerModule('src/data/catalog.ts', {
    'server-only': {}, '@/lib/catalog': catalog,
    '@/data/supabase': { supabaseServerClient: { from(table) {
      calls.push({ table })
      return { select(columns) {
        calls.push({ columns })
        return {
          ilike(column, pattern) {
            calls.push({ column, pattern })
            return { order(key) {
              calls.push({ order: key })
              return { async limit(limit) {
                calls.push({ limit })
                if (throws) throw new Error('private database error')
                const index = ['title_romaji', 'title_english', 'title_native'].indexOf(column)
                return { data: rows[index], error: column === failedColumn ? { message: 'private detail' } : null }
              } }
            } }
          },
          eq(column, value) {
            calls.push({ column, value })
            return { async maybeSingle() {
              if (throws) throw new Error('private database error')
              return { data: detail, error: failedColumn ? { message: 'private detail' } : null }
            } }
          }
        }
      } }
    } } }
  })
  return { data, calls }
}

test('Local search deduplicates multilingual matches, bounds results and omits external identity', async () => {
  const h = readerHarness()
  const result = await h.data.searchCatalogAnime(' Naruto ')
  assert.deepEqual(result.results, [{ id: animeId, title: 'Naruto', cover_image: row.cover_image,
    year: 2002, format: 'TV', status: 'FINISHED', episodes: 220 }])
  assert.equal(h.calls.filter(call => call.table).every(call => call.table === 'anime'), true)
  assert.equal(h.calls.filter(call => call.limit).every(call => call.limit === 20), true)
  assert.equal(h.calls.filter(call => call.columns).some(call => call.columns.includes('anilist_id')), false)
  const many = Array.from({ length: 25 }, (_, i) => ({ ...row, id: `id-${i}`, title_romaji: `Anime ${i}` }))
  assert.equal((await readerHarness({ rows: [many, many, []] }).data.searchCatalogAnime('Anime')).results.length, 20)
})

test('Search passes punctuation as a filter value, escapes wildcards and never builds an OR expression', async () => {
  const h = readerHarness({ rows: [[], [], []] })
  assert.deepEqual(await h.data.searchCatalogAnime('a%,(title.eq.foo)_\\'), { results: [] })
  for (const call of h.calls.filter(call => call.pattern)) {
    assert.equal(call.pattern, '%a\\%,(title.eq.foo)\\_\\\\%')
  }
})

test('Invalid input makes no database request; database failures do not become empty success results', async () => {
  const h = readerHarness()
  assert.equal((await h.data.searchCatalogAnime('a')).code, 'INVALID_INPUT')
  assert.equal((await h.data.getCatalogAnime(20)).code, 'INVALID_INPUT')
  assert.deepEqual(h.calls, [])
  for (const options of [{ failedColumn: 'title_english' }, { throws: true }]) {
    const result = await readerHarness(options).data.searchCatalogAnime('Naruto')
    assert.equal(result.code, 'INTERNAL_ERROR')
    assert.equal(/private/.test(result.error), false)
  }
})

test('Local lookup uses only internal ID, preserves legacy text and does not return source IDs', async () => {
  const h = readerHarness()
  const result = await h.data.getCatalogAnime(animeId.toUpperCase())
  assert.equal(result.data.id, animeId)
  assert.equal(result.data.description, 'Legacy text')
  assert.equal('anilist_id' in result.data, false)
  assert.deepEqual(h.calls.find(call => call.column), { column: 'id', value: animeId })
  assert.equal((await readerHarness({ detail: null }).data.getCatalogAnime(animeId)).code, 'NOT_FOUND')
  assert.equal((await readerHarness({ failedColumn: 'id' }).data.getCatalogAnime(animeId)).code, 'INTERNAL_ERROR')
  const unsafe = await readerHarness({ detail: { ...row, cover_image: 'javascript:alert(1)', banner_image: 'http://example.org/image' } }).data.getCatalogAnime(animeId)
  assert.equal(unsafe.data.cover_image, null)
  assert.equal(unsafe.data.banner_image, null)
})

test('Catalogue actions authenticate before lookup and never accept caller ownership as authority', async () => {
  for (const session of [null, { profileId: 'actual-owner' }]) {
    const calls = []
    const actions = loadServerModule('src/actions/catalog.ts', {
      '@/lib/session': { getSession: async () => session },
      '@/data/catalog': {
        searchCatalogAnime: async query => { calls.push({ query }); return { results: [] } },
        getCatalogAnime: async id => { calls.push({ id }); return { data: { id } } },
      },
    })
    const search = await actions.searchCatalogAnimeAction('Naruto', { profileId: 'forged' })
    const detail = await actions.getCatalogAnimeAction(animeId, { profileId: 'forged' })
    if (!session) {
      assert.equal(search.code, 'UNAUTHORIZED')
      assert.equal(detail.code, 'UNAUTHORIZED')
      assert.deepEqual(calls, [])
    } else {
      assert.deepEqual(calls, [{ query: 'Naruto' }, { id: animeId }])
    }
  }
})

test('Search endpoint returns distinct authentication, validation and database errors with no caching', async () => {
  for (const [result, status] of [[{ results: [] }, 200],
    [{ error: 'Sign in', code: 'UNAUTHORIZED' }, 401],
    [{ error: 'Bad query', code: 'INVALID_INPUT' }, 400],
    [{ error: 'Try later', code: 'INTERNAL_ERROR' }, 503], [null, 503]]) {
    const route = loadServerModule('src/app/api/catalog/anime-search/route.ts', {
      '@/actions/catalog': { searchCatalogAnimeAction: async query => {
        assert.equal(query, 'Naruto')
        if (!result) throw new Error('private error')
        return result
      } },
    })
    const response = await route.GET(new Request('https://example.test/api/catalog/anime-search?q=Naruto'))
    assert.equal(response.status, status)
    assert.equal(response.headers.get('cache-control'), 'private, no-store')
    assert.equal((await response.text()).includes('private error'), false)
  }
})
