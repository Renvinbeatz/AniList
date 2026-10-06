import assert from 'node:assert/strict'
import test from 'node:test'
import { loadServerModule } from './helpers/load-server-module.mjs'

const constants = loadServerModule('src/lib/constants.ts', {})
const profileUtilities = loadServerModule('src/lib/public-profile.ts', {})
const animeUtilities = loadServerModule('src/lib/profile-anime.ts', {})
const utilities = loadServerModule('src/lib/public-library.ts', { './constants': constants, './public-profile': profileUtilities })
const item = { anilist_id: 1, title: 'Anime 😀 <script>x</script>', cover_image: null, status: 'watching' }
const library = { username: 'Cauã', profile_visibility: 'public', is_owner: false,
  counts: { total: 1, watching: 1, planned: 0, paused: 0, completed: 0, dropped: 0 },
  page: 1, page_size: 24, total_items: 1, items: [item] }
function harness({ data = library, session = null, error = null, thrown = false } = {}) {
  const calls = [], clients = []
  const rpc = async (...args) => { calls.push(args); if (thrown) throw new Error('SECRET transport'); return { data, error } }
  const reader = loadServerModule('src/data/public-library.ts', {
    'server-only': {}, '@/lib/public-profile': profileUtilities, '@/lib/public-library': utilities,
    '@/lib/profile-anime': animeUtilities, '@/lib/session': { getSession: async () => session },
    '@/utils/supabase/server': { createClient: async () => { clients.push('session'); return { rpc } } },
    '@supabase/supabase-js': { createClient: () => { clients.push('anonymous'); return { rpc } } },
  })
  return { reader, calls, clients }
}
await test('Public filters allow only the five existing categories and safe page numbers', () => {
  assert.deepEqual(utilities.publicLibraryFilter(undefined, undefined), { status: null, page: 1 })
  for (const status of Object.values(constants.LIBRARY_STATUS)) {
    assert.deepEqual(utilities.publicLibraryFilter(status, '2'), { status, page: 2 })
  }
  for (const status of ['custom', 'notes', ['watching'], null, 1]) assert.equal(utilities.publicLibraryFilter(status, '1'), null)
  for (const page of ['', '0', '-1', '1.5', '1e2', '01', '1000001', ['1'], 1, null]) assert.equal(utilities.publicLibraryFilter('', page), null)
})
await test('Public URLs encode usernames and retain the status during pagination', () => {
  assert.equal(utilities.publicLibraryPath('Cauã'), '/user/Cau%C3%A3/library')
  assert.equal(utilities.publicLibraryPath('Cauã', 'planned', 2), '/user/Cau%C3%A3/library?status=planned&page=2')
})
await test('Invalid parameters stop before any identity/client lookup or RPC', async () => {
  const h = harness()
  for (const [username, filter] of [['ab', { status: null, page: 1 }], ['Cauã', { status: 'custom', page: 1 }],
    ['Cauã', { status: null, page: 0 }], ['Cauã', { status: null, page: 1.5 }], ['Cauã', { status: null, page: 1000001 }]]) {
    assert.deepEqual(await h.reader.getPublicLibrary(username, filter), { data: null })
  }
  assert.deepEqual(h.clients, []); assert.deepEqual(h.calls, [])
})
await test('Anonymous requests use the public-key client and parameterized username/filter/page only', async () => {
  const h = harness()
  assert.deepEqual(await h.reader.getPublicLibrary('Cauã', { status: 'watching', page: 1 }), { data: library })
  assert.deepEqual(h.clients, ['anonymous'])
  assert.deepEqual(h.calls, [['read_public_library', { p_username: 'Cauã', p_status: 'watching', p_page: 1 }]])
})
await test('Only verified owner session permits a private snapshot; SSR keeps session identity', async () => {
  const privateData = { ...library, profile_visibility: 'private', is_owner: true }
  assert.ok('error' in await harness({ data: privateData }).reader.getPublicLibrary('Cauã', { status: null, page: 1 }))
  const owner = harness({ session: { profileId: 'owner' }, data: privateData })
  assert.deepEqual(await owner.reader.getPublicLibrary('Cauã', { status: null, page: 1 }), { data: privateData })
  assert.deepEqual(owner.clients, ['session'])
  assert.ok('error' in await harness({ session: { profileId: 'other' }, data: { ...privateData, is_owner: false } }).reader.getPublicLibrary('Cauã', { status: null, page: 1 }))
})
await test('Unknown root, count and item fields never reach the display DTO', async () => {
  const polluted = { ...library, auth_user_id: 'secret', profile_id: 'secret', counts: { ...library.counts, score: 99 },
    items: [{ ...item, current_episode: 12, score: 99, notes: 'secret', profile_id: 'secret', id: 'secret' }] }
  assert.deepEqual(await harness({ data: polluted }).reader.getPublicLibrary('Cauã', { status: null, page: 1 }), { data: library })
})
await test('Private/missing null stays absent; an authorized empty library is distinct', async () => {
  assert.deepEqual(await harness({ data: null }).reader.getPublicLibrary('Cauã', { status: null, page: 1 }), { data: null })
  const empty = { ...library, counts: { total: 0, watching: 0, planned: 0, paused: 0, completed: 0, dropped: 0 }, total_items: 0, items: [] }
  assert.deepEqual(await harness({ data: empty }).reader.getPublicLibrary('Cauã', { status: null, page: 1 }), { data: empty })
})
await test('Malformed totals, ownership, items and excessive payloads fail closed', async () => {
  for (const data of [{}, [], { ...library, page_size: 1000 }, { ...library, page: 0 }, { ...library, is_owner: 'true' },
    { ...library, counts: { ...library.counts, total: -1 } }, { ...library, items: Array(25).fill(item) },
    { ...library, items: [null] }, { ...library, items: [{ ...item, anilist_id: -1 }] },
    { ...library, items: [{ ...item, status: 'custom' }] }, { ...library, items: [{ ...item, cover_image: {} }] }]) {
    assert.ok('error' in await harness({ data }).reader.getPublicLibrary('Cauã', { status: null, page: 1 }))
  }
})
await test('Database/transport failure is generic instead of a false empty list', async () => {
  for (const options of [{ error: { message: 'SECRET database' } }, { thrown: true }]) {
    const result = await harness(options).reader.getPublicLibrary('Cauã', { status: null, page: 1 })
    assert.ok('error' in result); assert.equal(result.error.includes('SECRET'), false)
  }
})
