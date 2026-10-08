import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import nextEnv from '@next/env'
import { loadServerModule } from './helpers/load-server-module.mjs'

if (!process.argv.includes('--live')) {
  console.log('Consulta real do catálogo exige --live. Este teste executa somente leituras.')
  process.exit(0)
}

nextEnv.loadEnvConfig(process.cwd())
const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SECRET_KEY
assert.equal(new URL(url).hostname, 'hhprevdkcvqxikmeolxd.supabase.co', 'Projeto inesperado')
assert.ok(key, 'Credencial do servidor ausente')
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
const catalog = loadServerModule('src/lib/catalog.ts', {})
const data = loadServerModule('src/data/catalog.ts', {
  'server-only': {}, '@/lib/catalog': catalog,
  '@/data/supabase': { supabaseServerClient: client },
})

const original = await client.from('anime').select('*').order('id')
assert.ifError(original.error)
assert.ok(original.data.length, 'O teste precisa de uma obra já cadastrada')
const first = original.data.find(row => [row.title_romaji, row.title_english, row.title_native]
  .some(title => title && [...title.trim()].length >= 2 && [...title.trim()].length <= 100))
assert.ok(first, 'Nenhum título adequado ao teste foi encontrado')
const title = [first.title_romaji, first.title_english, first.title_native]
  .find(value => value && [...value.trim()].length >= 2 && [...value.trim()].length <= 100)

const detail = await data.getCatalogAnime(first.id)
assert.ok(detail.data, 'Leitura por UUID falhou')
assert.equal(detail.data.id, first.id)
assert.equal(detail.data.description, first.description)
assert.equal('anilist_id' in detail.data, false)

const search = await data.searchCatalogAnime(title)
assert.ok(search.results, 'Busca local falhou')
assert.ok(search.results.some(row => row.id === first.id), 'Busca não encontrou a obra existente')
assert.ok(search.results.length <= catalog.CATALOG_SEARCH_LIMIT)
assert.equal(new Set(search.results.map(row => row.id)).size, search.results.length)

const missing = await data.getCatalogAnime('ffffffff-ffff-4fff-8fff-ffffffffffff')
assert.equal(missing.code, 'NOT_FOUND')
const wildcard = await data.searchCatalogAnime('%_')
assert.ok(wildcard.results, 'Busca literal por caracteres especiais falhou')
assert.ok(wildcard.results.every(result => original.data.some(row => row.id === result.id
  && [row.title_romaji, row.title_english, row.title_native].some(title => title?.includes('%_')))))

const final = await client.from('anime').select('*').order('id')
assert.ifError(final.error)
assert.deepEqual(final.data, original.data, 'O teste alterou registros do catálogo')
console.log(`Catálogo real: ${original.data.length} obras preservadas; busca, UUID, ausência e caracteres especiais verificados. Nenhuma escrita ou chamada à AniList.`)
