import assert from 'node:assert/strict'
import test from 'node:test'
import { loadServerModule } from './helpers/load-server-module.mjs'

const validation = loadServerModule('src/lib/validations/profile.ts', {})
function harness(session = { profileId: 'owner' }, error = null) {
  const writes = [], paths = []
  const actions = loadServerModule('src/actions/profile.ts', {
    '@/lib/session': { getSession: async () => session },
    '@/lib/validations/profile': validation,
    '@/data/profile-character': { getProfileCharacter: async () => { throw new Error('Avatar must not resolve a character') } },
    '@/data/supabase': { supabaseServerClient: { from: () => ({ update: payload => ({ eq: async (...filter) => {
      writes.push({ payload, filter }); return { error }
    } }) }) } },
    'next/cache': { revalidatePath: path => paths.push(path) }
  })
  return { actions, writes, paths }
}
await test('Avatar catalog has stable distinct IDs; server rejects arbitrary values and URLs', async () => {
  const ids = validation.AVATAR_PRESETS.map(item => item.id)
  assert.equal(ids.length, 24)
  assert.equal(new Set(ids).size, 24)
  for (const legacy of ['black', 'blue', 'purple']) assert.ok(ids.includes(legacy))
  for (const expression of validation.AVATAR_EXPRESSIONS) assert.equal(validation.AVATAR_PRESETS.filter(avatar => avatar.expression === expression.id).length, 6)
  assert.equal(validation.resolveAvatarPreset(null).id, 'black')
  assert.equal(validation.resolveAvatarPreset('unknown').id, 'black')
  for (const avatar_preset of ['', 'red', 'https://example.com/avatar', 1, {}, ['blue']]) {
    const h = harness()
    assert.equal((await h.actions.updateProfileSettings({ avatar_preset })).code, 'INVALID_INPUT')
    assert.deepEqual(h.writes, [])
  }
})
await test('Avatar authenticates before writes, independent of submitted ownership', async () => {
  const h = harness(null)
  assert.equal((await h.actions.updateProfileSettings({ avatar_preset: 'blue' })).code, 'UNAUTHORIZED')
  assert.deepEqual(h.writes, [])
})
await test('Every preset saves only the session owner and revalidates both private screens', async () => {
  for (const { id: avatar_preset } of validation.AVATAR_PRESETS) {
    const h = harness()
    assert.equal((await h.actions.updateProfileSettings({ avatar_preset, profile_id: 'victim', auth_user_id: 'victim' })).success, true)
    assert.deepEqual(h.writes, [{ payload: { avatar_preset }, filter: ['id', 'owner'] }])
    assert.deepEqual(h.paths, ['/profile', '/profile/settings', '/user/[username]'])
  }
})
await test('Omitted avatar is preserved; null resets default without changing other fields', async () => {
  const h = harness()
  await h.actions.updateProfileSettings({ bio: 'new' })
  await h.actions.updateProfileSettings({ avatar_preset: null })
  assert.deepEqual(h.writes.map(write => write.payload), [{ bio: 'new' }, { avatar_preset: null }])
})
await test('Failed database update never announces success or invalidates cache', async () => {
  const h = harness(undefined, { code: 'TEST_FAILURE' })
  assert.equal((await h.actions.updateProfileSettings({ avatar_preset: 'purple' })).code, 'INTERNAL_ERROR')
  assert.deepEqual(h.paths, [])
})
await test('Name and biography use Unicode code points for their exact limits', () => {
  assert.equal(validation.validateProfileSettings({ display_name: '😀'.repeat(50), bio: '😀'.repeat(500) }), null)
  assert.equal(validation.validateProfileSettings({ display_name: '😀'.repeat(51) }).code, 'INVALID_INPUT')
  assert.equal(validation.validateProfileSettings({ bio: '😀'.repeat(501) }).code, 'INVALID_INPUT')
})
await test('HTTPS banner validation rejects scripts, HTTP, malformed and oversized URLs', () => {
  for (const banner_url of ['http://example.com/a', 'javascript:alert(1)', 'https://', 'https://example.com/' + 'x'.repeat(2000)]) {
    assert.equal(validation.validateProfileSettings({ banner_url }).code, 'INVALID_INPUT')
  }
  assert.equal(validation.validateProfileSettings({ banner_url: 'https://example.com/a.png' }), null)
})
await test('Removing optional text normalizes to null; HTML and line breaks remain plain input', async () => {
  const h = harness()
  await h.actions.updateProfileSettings({ display_name: '', bio: '', banner_url: '' })
  assert.deepEqual(h.writes[0].payload, { display_name: null, bio: null, banner_url: null })
  const bio = '<script>hello</script>\nAnime 😀'
  await h.actions.updateProfileSettings({ bio })
  assert.equal(h.writes[1].payload.bio, bio)
})
