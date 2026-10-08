import assert from 'node:assert/strict'
import test from 'node:test'
import { loadServerModule } from './helpers/load-server-module.mjs'

const rules = loadServerModule('src/lib/platforms.ts', {})
const streaming = loadServerModule('src/lib/streaming.ts', { '@/lib/platforms': rules })
const id = 'b3b98a2a-3c52-4ddc-9acf-e7a119bd60cb'

test('Personal platforms normalize optional URLs and reject identity overposting', () => {
  assert.deepEqual(rules.validatePersonalPlatform({ name: '  Meu site  ', website_url: '' }), { data: { name: 'Meu site', website_url: null } })
  assert.ok(rules.validatePersonalPlatform({ name: 'Meu site', profile_id: id }).error)
  for (const input of [null, [], {}, { name: '' }, { name: 'a\nb' }, { name: '😺'.repeat(61) }, { name: 'site', website_url: 3 }]) assert.ok(rules.validatePersonalPlatform(input).error)
  assert.ok(rules.validatePersonalPlatform({ name: '😺'.repeat(60) }).data)
})

test('Platform links accept HTTPS without credentials and reject unsafe URLs', () => {
  for (const url of ['javascript:alert(1)', 'http://site.test', 'https://user:secret@site.test', 'https://site.test\n', 'https://site.test/' + 'x'.repeat(2000)]) assert.equal(rules.platformHttpsUrl(url), null)
  assert.equal(rules.platformHttpsUrl('https://site.test/path?q=1'), 'https://site.test/path?q=1')
  assert.equal(rules.isPlatformId(id), true)
  for (const value of [null, '20', NaN, 0, 2.1, Infinity, 2147483648]) assert.equal(rules.isPlatformAnimeId(value), false)
})

test('Official links reject information links, disabled services, lookalike hosts and duplicates', () => {
  const link = { type: 'STREAMING', url: 'https://www.crunchyroll.com/series/test', language: 'English' }
  const result = streaming.normalizeStreamingLinks([link, link,
    { ...link, url: 'https://crunchyroll.com.evil.test/show' },
    { ...link, url: 'https://evilcrunchyroll.com/show' },
    { ...link, type: 'INFO' }, { ...link, isDisabled: true },
    { ...link, url: 'javascript:alert(1)' }, null])
  assert.deepEqual(result, [{ name: 'Crunchyroll', url: link.url, language: 'English' }])
  assert.equal(streaming.normalizeStreamingLinks(Array.from({ length: 30 }, (_, i) => ({ ...link, url: `${link.url}/${i}` }))).length, 12)
})

test('Streaming lookup distinguishes an empty response from an outage or wrong media', async () => {
  let calls = 0, response = { data: { Media: { id: 20, externalLinks: [] } } }
  const reader = loadServerModule('src/data/streaming.ts', {
    'server-only': {}, '@/lib/platforms': rules, '@/lib/streaming': streaming,
    '@/lib/anilist/client': { fetchAniList: async () => { calls++; if (response instanceof Error) throw response; return response } },
  })
  assert.equal((await reader.getStreamingLinks(20)).state, 'empty')
  response = new Error('private failure'); assert.equal((await reader.getStreamingLinks(20)).state, 'unavailable')
  response = { data: { Media: { id: 1, externalLinks: [] } } }; assert.equal((await reader.getStreamingLinks(20)).state, 'unavailable')
  response = { data: { Media: { id: 20, externalLinks: [{ type: 'STREAMING', url: 'https://netflix.com/title/test' }] } } }
  assert.equal((await reader.getStreamingLinks(20)).state, 'available')
  const before = calls; assert.equal((await reader.getStreamingLinks(0)).state, 'unavailable'); assert.equal(calls, before)
})

function harness(session, replies = [], modulePath = 'src/actions/personal-platforms.ts') {
  const trace = [], queue = [...replies]
  const client = { from(table) {
    const record = { table, operations: [] }; trace.push(record)
    const builder = {}
    for (const method of ['select', 'eq', 'insert', 'update', 'delete', 'upsert']) builder[method] = (...args) => { record.operations.push([method, ...args]); return builder }
    const result = () => Promise.resolve(queue.shift() ?? { data: null, error: null })
    builder.single = result; builder.maybeSingle = result; builder.then = (ok, bad) => result().then(ok, bad)
    return builder
  } }
  const actions = loadServerModule(modulePath, {
    '@/lib/session': { getSession: async () => session }, '@/data/supabase': { supabaseServerClient: client },
    'next/cache': { revalidatePath: () => {} }, '@/lib/platforms': rules,
  })
  return { trace, actions }
}

test('Personal platform actions authenticate before any database call', async () => {
  const { actions, trace } = harness(null)
  for (const result of [await actions.savePersonalPlatformAction({ name: 'x' }), await actions.deletePersonalPlatformAction(id), await actions.setPersonalPlatformAction(20, id, true)]) assert.equal(result.error, 'Não autorizado.')
  assert.equal(trace.length, 0)
})

test('Save and delete scope mutations to the session owner and refuse unknown IDs', async () => {
  const owner = 'owner', { actions, trace } = harness({ profileId: owner }, [{ data: { id }, error: null }, { data: null, error: null }])
  assert.equal((await actions.savePersonalPlatformAction({ name: '  site ' }, id)).error, null)
  assert.deepEqual(trace[0].operations.find(op => op[0] === 'update'), ['update', { name: 'site', website_url: null }])
  assert.ok(trace[0].operations.some(op => op[0] === 'eq' && op[1] === 'profile_id' && op[2] === owner))
  assert.equal((await actions.deletePersonalPlatformAction(id)).error, 'Plataforma não encontrada.')
  assert.ok(trace[1].operations.some(op => op[0] === 'eq' && op[1] === 'profile_id' && op[2] === owner))
})

test('Foreign platforms cannot be associated and ownership reaches the join table', async () => {
  const denied = harness({ profileId: 'owner' }, [{ data: null, error: null }])
  assert.ok((await denied.actions.setPersonalPlatformAction(20, id, true)).error); assert.equal(denied.trace.length, 1)
  const allowed = harness({ profileId: 'owner' }, [{ data: { id }, error: null }, { data: { id: 'library-id' }, error: null }, { data: null, error: null }])
  assert.equal((await allowed.actions.setPersonalPlatformAction(20, id, true)).error, null)
  assert.ok(allowed.trace[1].operations.some(op => op[0] === 'eq' && op[1] === 'profile_id' && op[2] === 'owner'))
  const mutation = allowed.trace[2].operations.find(op => op[0] === 'upsert')
  assert.deepEqual(mutation[1], { profile_id: 'owner', user_anime_id: 'library-id', personal_platform_id: id })
})

test('Duplicate names and invalid payloads produce friendly errors without identity leakage', async () => {
  const duplicate = harness({ profileId: 'owner' }, [{ data: null, error: { code: '23505', message: 'secret' } }])
  assert.equal((await duplicate.actions.savePersonalPlatformAction({ name: 'site' })).error, 'Você já tem uma plataforma com esse nome.')
  const invalid = harness({ profileId: 'owner' })
  assert.ok((await invalid.actions.savePersonalPlatformAction({ name: 'site', profile_id: id })).error)
  assert.ok((await invalid.actions.setPersonalPlatformAction(20, id, 'true')).error)
  assert.equal(invalid.trace.length, 0)
})

test('Existing manual platform choices validate IDs and still use the owner library item', async () => {
  const modulePath = 'src/actions/platforms.ts'
  const anonymous = harness(null, [], modulePath)
  assert.equal((await anonymous.actions.addPlatformAction(20, id)).error, 'Não autorizado.')
  assert.equal(anonymous.trace.length, 0)
  const invalid = harness({ profileId: 'owner' }, [], modulePath)
  assert.ok((await invalid.actions.addPlatformAction(0, id)).error)
  assert.ok((await invalid.actions.removePlatformAction(20, 'invalid')).error)
  assert.equal(invalid.trace.length, 0)
  const missing = harness({ profileId: 'owner' }, [{ data: null, error: null }], modulePath)
  assert.ok((await missing.actions.addPlatformAction(20, id)).error)
  assert.equal(missing.trace.length, 1)
  const allowed = harness({ profileId: 'owner' }, [
    { data: { id }, error: null }, { data: { id: 'library-id' }, error: null }, { data: null, error: null },
    { data: { id: 'library-id' }, error: null }, { data: null, error: null },
  ], modulePath)
  assert.equal((await allowed.actions.addPlatformAction(20, id)).error, null)
  assert.deepEqual(allowed.trace[2].operations.find(op => op[0] === 'insert'), ['insert', { user_anime_id: 'library-id', platform_id: id }])
  assert.equal((await allowed.actions.removePlatformAction(20, id)).error, null)
  for (const index of [1, 3]) assert.ok(allowed.trace[index].operations.some(op => op[0] === 'eq' && op[1] === 'profile_id' && op[2] === 'owner'))
  assert.ok(allowed.trace[4].operations.some(op => op[0] === 'eq' && op[1] === 'user_anime_id' && op[2] === 'library-id'))
})
