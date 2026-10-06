import assert from 'node:assert/strict'
import test from 'node:test'
import { loadServerModule } from './helpers/load-server-module.mjs'

const utilities = loadServerModule('src/lib/public-profile.ts', {})
const social=loadServerModule('src/lib/profile-social-links.ts',{})
const profile = { social_links:null, username: 'Cauã', display_name: null, bio: 'Anime 😀\n<script>x</script>', banner_url: null,
  avatar_preset: 'blue', favorite_character_anilist_id: 40, profile_visibility: 'public', is_owner: false,
  collections: { favorites: [], pinned: [] } }
function harness({ session = null, data = profile, error = null, thrown = false } = {}) {
  const calls = [], clients = []
  const rpc = async (...args) => { calls.push(args); if (thrown) throw new Error('Secret transport failure'); return { data, error } }
  const reader = loadServerModule('src/data/public-profile.ts', {
    'server-only': {}, '@/lib/public-profile': utilities, '@/lib/profile-social-links':social,
    '@/lib/session': { getSession: async () => session },
    '@/utils/supabase/server': { createClient: async () => { clients.push('session'); return { rpc } } },
    '@supabase/supabase-js': { createClient: () => { clients.push('anonymous'); return { rpc } } },
  })
  return { reader, calls, clients }
}
await test('URLs preserve existing uppercase/accents and encode reserved characters', () => {
  assert.equal(utilities.publicProfilePath('Cauã'), '/user/Cau%C3%A3')
  assert.equal(utilities.publicProfilePath('A?B#C'), '/user/A%3FB%23C')
  assert.ok(utilities.validPublicUsername('Cauã'))
  assert.ok(utilities.validPublicUsername('A%_B'))
})
await test('Invalid usernames never create a client or request data', async () => {
  const h = harness()
  for (const username of ['', 'ab', 'x'.repeat(31), 'a/b', 'a\\b', 'a\nb', null, 2]) {
    assert.deepEqual(await h.reader.getPublicProfile(username), { data: null })
  }
  assert.deepEqual(h.calls, [])
})
await test('Encoded route segments decode once, preserving accents and literal percent sequences', () => {
  for (const username of ['Cauã', 'V3P_Cauã_123456789abc', 'A%20B', 'A?B#C']) {
    assert.equal(utilities.usernameFromRoute(encodeURIComponent(username)), username)
  }
})
await test('Malformed encoding, decoded delimiters/control characters and oversized names are refused', () => {
  for (const value of ['%ZZ', '%C3', 'a%2Fb', 'a%5Cb', 'a%00b', 'a%0Ab', 'x'.repeat(31)]) {
    assert.equal(utilities.usernameFromRoute(value), null)
  }
})
await test('Anonymous read uses only the public key client and parameterized username', async () => {
  const h = harness()
  assert.deepEqual(await h.reader.getPublicProfile('Cauã'), { data: profile })
  assert.deepEqual(h.clients, ['anonymous'])
  assert.deepEqual(h.calls, [['read_public_profile', { p_username: 'Cauã' }]])
})
await test('Authenticated read retains verified SSR identity without sending profile IDs', async () => {
  const h = harness({ session: { profileId: 'owner' }, data: { ...profile, is_owner: true } })
  assert.equal((await h.reader.getPublicProfile('Cauã')).data.is_owner, true)
  assert.deepEqual(h.clients, ['session'])
  assert.deepEqual(h.calls[0][1], { p_username: 'Cauã' })
})
await test('Private/nonexistent RPC result remains indistinguishable and returns no data', async () => {
  assert.deepEqual(await harness({ data: null }).reader.getPublicProfile('Cauã'), { data: null })
})
await test('Private payload is refused without verified owner session', async () => {
  for (const options of [{ data: { ...profile, profile_visibility: 'private', is_owner: true } },
    { session: { profileId: 'other' }, data: { ...profile, profile_visibility: 'private', is_owner: false } }]) {
    assert.ok('error' in await harness(options).reader.getPublicProfile('Cauã'))
  }
  const owner = harness({ session: { profileId: 'owner' }, data: { ...profile, profile_visibility: 'private', is_owner: true } })
  assert.equal((await owner.reader.getPublicProfile('Cauã')).data.profile_visibility, 'private')
})
await test('Unexpected root fields are excluded from display data', async () => {
  const h = harness({ data: { ...profile, auth_user_id: 'secret', id: 'secret', user_anime: ['secret'] } })
  assert.deepEqual(await h.reader.getPublicProfile('Cauã'), { data: profile })
})
await test('Malformed contracts fail closed; database and transport errors stay generic', async () => {
  for (const data of [{}, [], { ...profile, is_owner: 'true' }, { ...profile, profile_visibility: 'unknown' },
    { ...profile, collections: null }]) assert.ok('error' in await harness({ data }).reader.getPublicProfile('Cauã'))
  for (const options of [{ error: { message: 'Secret SQL error' } }, { thrown: true }]) {
    const result = await harness(options).reader.getPublicProfile('Cauã')
    assert.ok('error' in result)
    assert.equal(result.error.includes('Secret'), false)
  }
})

await test('Public links are validated before display; unsafe or unexpected values fail closed',async()=>{
  const data={...profile,social_links:{github:'https://github.com/user',x:'https://x.com/user'}}
  assert.deepEqual((await harness({data}).reader.getPublicProfile('Cauã')).data.social_links,data.social_links)
  for(const social_links of [{github:'javascript:alert(1)'},{github:'https://evil.test'},{unknown:'https://x.com'},[],undefined])assert.ok('error' in await harness({data:{...profile,social_links}}).reader.getPublicProfile('Cauã'))
})
