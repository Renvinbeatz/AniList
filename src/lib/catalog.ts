// The catalogue identity belongs to Anicat, regardless of metadata provenance.
export const CATALOG_SEARCH_LIMIT = 20
export const CATALOG_FORMATS = ['TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA', 'MUSIC', 'OTHER'] as const
export const CATALOG_STATUSES = ['FINISHED', 'RELEASING', 'NOT_YET_RELEASED', 'CANCELLED', 'HIATUS'] as const

export type CatalogFormat = typeof CATALOG_FORMATS[number]
export type CatalogStatus = typeof CATALOG_STATUSES[number]

export type CatalogAnimeSummary = {
  id: string
  title: string
  cover_image: string | null
  year: number | null
  format: string | null
  status: string | null
  episodes: number | null
}

export type CatalogAnime = CatalogAnimeSummary & {
  title_english: string | null
  title_native: string | null
  description: string | null
  banner_image: string | null
  duration: number | null
  genres: string[] | null
}

// An editorial draft is not a published record or an image licence.
// Creation and publication will require staff authorization in the next stage.
export type CatalogAnimeDraft = {
  title: string
  title_english: string | null
  title_native: string | null
  description: string | null
  format: CatalogFormat
  status: CatalogStatus
  episodes: number | null
  duration: number | null
  year: number | null
  genres: string[] | null
  source_url: string | null
  rights_note: string | null
}

export type CatalogError = {
  error: string
  code: 'UNAUTHORIZED' | 'INVALID_INPUT' | 'NOT_FOUND' | 'INTERNAL_ERROR'
}

export function isCatalogId(value: unknown): value is string {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export function validateCatalogQuery(value: unknown): { query: string } | CatalogError {
  if (typeof value !== 'string') return invalidCatalogQuery()
  const query = value.trim()
  if ([...query].length < 2 || [...query].length > 100 || /[\u0000-\u001f\u007f]/.test(query)) {
    return invalidCatalogQuery()
  }
  return { query }
}

function invalidCatalogQuery(): CatalogError {
  return { error: 'Digite de 2 a 100 caracteres para buscar.', code: 'INVALID_INPUT' }
}

// A user-entered % or _ is a literal character, not a catalogue-wide wildcard.
export function catalogSearchPattern(query: string): string {
  return `%${query.replace(/[\\%_]/g, '\\$&')}%`
}

export function catalogHttpsUrl(value: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password ? value : null
  } catch {
    return null
  }
}
