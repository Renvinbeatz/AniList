import 'server-only'

import { supabaseServerClient } from '@/data/supabase'
import type { Tables } from '@/data/database.types'
import { CATALOG_SEARCH_LIMIT, catalogHttpsUrl, catalogSearchPattern, isCatalogId, validateCatalogQuery,
  type CatalogAnime, type CatalogAnimeSummary, type CatalogError } from '@/lib/catalog'

const SUMMARY_COLUMNS = 'id, title_romaji, title_english, title_native, cover_image, season_year, format, status, episodes' as const
const DETAIL_COLUMNS = 'id, title_romaji, title_english, title_native, cover_image, season_year, format, status, episodes, description, banner_image, duration, genres' as const
type SummaryRow = Pick<Tables<'anime'>, 'id' | 'title_romaji' | 'title_english' | 'title_native' | 'cover_image' | 'season_year' | 'format' | 'status' | 'episodes'>

function summarize(row: SummaryRow): CatalogAnimeSummary {
  return {
    id: row.id,
    title: row.title_romaji || row.title_english || row.title_native || 'Anime sem título',
    cover_image: catalogHttpsUrl(row.cover_image),
    year: row.season_year,
    format: row.format,
    status: row.status,
    episodes: row.episodes,
  }
}

function unavailable(): CatalogError {
  return { error: 'Não foi possível consultar o catálogo agora. Tente novamente.', code: 'INTERNAL_ERROR' }
}

// Read-only transition adapter for existing catalogue rows. It neither imports
// metadata nor changes the provenance or permission status of legacy content.
export async function searchCatalogAnime(input: unknown): Promise<{ results: CatalogAnimeSummary[] } | CatalogError> {
  const validated = validateCatalogQuery(input)
  if ('error' in validated) return validated
  try {
    const pattern = catalogSearchPattern(validated.query)
    const searches = await Promise.all(['title_romaji', 'title_english', 'title_native'].map(column =>
      supabaseServerClient.from('anime').select(SUMMARY_COLUMNS)
        .ilike(column, pattern).order('id').limit(CATALOG_SEARCH_LIMIT)
    ))
    if (searches.some(search => search.error)) return unavailable()
    const rows = new Map<string, CatalogAnimeSummary>()
    for (const search of searches) {
      for (const row of search.data ?? []) rows.set(row.id, summarize(row))
    }
    const results = [...rows.values()].sort((a, b) =>
      a.title.localeCompare(b.title, 'pt-BR') || a.id.localeCompare(b.id)
    ).slice(0, CATALOG_SEARCH_LIMIT)
    return { results }
  } catch {
    return unavailable()
  }
}

export async function getCatalogAnime(input: unknown): Promise<{ data: CatalogAnime } | CatalogError> {
  if (!isCatalogId(input)) return { error: 'Anime inválido.', code: 'INVALID_INPUT' }
  try {
    const { data: row, error } = await supabaseServerClient.from('anime')
      .select(DETAIL_COLUMNS).eq('id', input.toLowerCase()).maybeSingle()
    if (error) return unavailable()
    if (!row) return { error: 'Anime não encontrado no catálogo.', code: 'NOT_FOUND' }
    return { data: {
      ...summarize(row),
      title_english: row.title_english,
      title_native: row.title_native,
      description: row.description,
      banner_image: catalogHttpsUrl(row.banner_image),
      duration: row.duration,
      genres: row.genres,
    } }
  } catch {
    return unavailable()
  }
}
