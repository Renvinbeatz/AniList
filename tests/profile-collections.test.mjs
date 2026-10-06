import assert from 'node:assert/strict'
import test from 'node:test'
import { loadServerModule } from './helpers/load-server-module.mjs'

const validations = loadServerModule('src/lib/validations/profile.ts', {})
const animeId = '10000000-0000-4000-8000-000000000001'
const profileId = '20000000-0000-4000-8000-000000000001'
const methods = [
  ['addProfileFavorite', 'favorites', 'add', 10],
  ['removeProfileFavorite', 'favorites', 'remove', 10],
  ['reorderProfileFavorite', 'favorites', 'reorder', 10],
  ['addProfilePinnedAnime', 'pinned', 'add', 6],
  ['removeProfilePinnedAnime', 'pinned', 'remove', 6],
  ['reorderProfilePinnedAnime', 'pinned', 'reorder', 6]
]

function harness({ session = { profileId }, status = 'OK', rpcError = null, readError = null, throws = false } = {}) {
  const calls = []
  const paths = []
  const reads = []
  const client = {
    async rpc(name, args) {
      calls.push({ name, args })
      if (throws) throw new Error('private database detail')
      return { data: status, error: rpcError }
    },
    from(table) {
      const read = { table }
      reads.push(read)
      return {
        select(columns) {
          read.columns = columns
          return {
            eq(column, value) {
              read.filter = { column, value }
              return {
                async order(column, options) {
                  read.order = { column, options }
                  return { data: [], error: readError }
                }
              }
            }
          }
        }
      }
    }
  }
  const actions = loadServerModule('src/actions/profile.ts', {
    '@/data/supabase': { supabaseServerClient: client },
    '@/lib/session': { getSession: async () => session },
    '@/data/profile-character': {},
    '@/lib/validations/profile': validations,
    'next/cache': { revalidatePath: (path) => paths.push(path) }
  })
  return { actions, calls, paths, reads }
}

for (const [method, collection, operation, limit] of methods) {
  await test(`${method}: rejects absent session before touching the database`, async () => {
    const h = harness({ session: null })
    assert.equal((await h.actions[method](animeId, 1)).code, 'UNAUTHORIZED')
    assert.deepEqual(h.calls, [])
    assert.deepEqual(h.paths, [])
  })

  await test(`${method}: rejects malformed IDs and invalid positions without an RPC`, async () => {
    const h = harness()
    for (const invalidId of ['', 'not-a-uuid', null, 123]) {
      assert.equal((await h.actions[method](invalidId, 1)).code, 'INVALID_INPUT')
    }
    if (operation !== 'remove') {
      for (const position of [0, -1, limit + 1, 1.5, NaN, Infinity, '1', null, undefined]) {
        assert.equal((await h.actions[method](animeId, position)).code, 'INVALID_INPUT')
      }
    }
    assert.deepEqual(h.calls, [])
    assert.deepEqual(h.paths, [])
  })

  await test(`${method}: resolves ownership from session and revalidates only after success`, async () => {
    const h = harness()
    const result = await h.actions[method](animeId, limit, { profileId: 'spoofed' })
    assert.deepEqual(result, { success: true })
    assert.deepEqual(h.calls, [{ name: 'mutate_profile_collection', args: {
      p_profile_id: profileId,
      p_collection: collection,
      p_operation: operation,
      p_anime_id: animeId,
      ...(operation === 'remove' ? {} : { p_position: limit })
    } }])
    assert.deepEqual(h.paths, ['/profile', '/profile/settings', '/user/[username]'])
  })
}

await test('RPC business errors are preserved and never revalidate', async () => {
  for (const status of ['INVALID_INPUT', 'NOT_FOUND', 'ALREADY_EXISTS', 'POSITION_CONFLICT']) {
    const h = harness({ status })
    assert.equal((await h.actions.addProfileFavorite(animeId, 1)).code, status)
    assert.deepEqual(h.paths, [])
  }
})

await test('Unknown RPC responses and exceptions fail closed without leaking details', async () => {
  for (const options of [{ status: null }, { status: 'UNEXPECTED_STATUS' }, { throws: true }]) {
    const h = harness(options)
    const result = await h.actions.reorderProfileFavorite(animeId, 1)
    assert.equal('success' in result, false)
    assert.equal(result.error.includes('private database detail'), false)
    assert.deepEqual(h.paths, [])
  }
})

await test('Database transport failures never produce success or cache invalidation', async () => {
  const h = harness({ rpcError: { code: 'TEST_FAILURE' } })
  assert.equal((await h.actions.removeProfileFavorite(animeId)).code, 'INTERNAL_ERROR')
  assert.deepEqual(h.paths, [])
})

await test('Collection reader requires a session and does not query without one', async () => {
  const h = harness({ session: null })
  assert.equal((await h.actions.getProfileCollections()).code, 'UNAUTHORIZED')
  assert.deepEqual(h.reads, [])
})

await test('Collection reader filters both tables by server identity and orders slots', async () => {
  const h = harness()
  assert.deepEqual(await h.actions.getProfileCollections(), { data: { favorites: [], pinned: [] } })
  assert.deepEqual(h.reads.map((read) => read.table), ['profile_favorites', 'profile_pinned_anime'])
  for (const read of h.reads) {
    assert.deepEqual(read.filter, { column: 'profile_id', value: profileId })
    assert.deepEqual(read.order, { column: 'position', options: { ascending: true } })
    assert.equal(read.columns.includes('profile_id'), false)
    assert.equal(read.columns.includes('auth_user_id'), false)
    assert.equal(read.columns.includes('!inner'), true)
  }
})

await test('Collection reader returns an error rather than presenting database failure as an empty collection', async () => {
  const h = harness({ readError: { code: 'TEST_FAILURE' } })
  assert.equal((await h.actions.getProfileCollections()).code, 'INTERNAL_ERROR')
})
