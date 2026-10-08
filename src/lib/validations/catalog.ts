import { CATALOG_FORMATS, CATALOG_STATUSES, catalogHttpsUrl, type CatalogAnimeDraft, type CatalogError } from '@/lib/catalog'

type DraftField = keyof CatalogAnimeDraft
type DraftError = CatalogError & { field?: DraftField }
type DraftResult = { data: CatalogAnimeDraft } | DraftError

const TEXT_LIMITS = {
  title: 200,
  title_english: 200,
  title_native: 200,
  description: 5000,
  source_url: 2000,
  rights_note: 1000,
} as const

export function validateCatalogDraft(input: unknown): DraftResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { error: 'Dados do anime inválidos.', code: 'INVALID_INPUT' }
  }
  const fields = input as Record<string, unknown>
  const text = {} as Record<keyof typeof TEXT_LIMITS, string | null>
  for (const [name, limit] of Object.entries(TEXT_LIMITS)) {
    const field = name as keyof typeof TEXT_LIMITS
    const raw = fields[field]
    if (raw !== undefined && raw !== null && typeof raw !== 'string') {
      return invalid(field, 'Preencha este campo com texto.')
    }
    const value = typeof raw === 'string' ? raw.trim() : null
    if (value && ([...value].length > limit || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value))) {
      return invalid(field, `Use no máximo ${limit} caracteres válidos.`)
    }
    text[field] = value || null
  }
  if (!text.title) return invalid('title', 'Informe o título do anime.')
  if (text.source_url && !catalogHttpsUrl(text.source_url)) {
    return invalid('source_url', 'Informe uma fonte com URL HTTPS válida, sem credenciais.')
  }
  if (!CATALOG_FORMATS.includes(fields.format as CatalogAnimeDraft['format'])) {
    return invalid('format', 'Escolha um formato válido.')
  }
  if (!CATALOG_STATUSES.includes(fields.status as CatalogAnimeDraft['status'])) {
    return invalid('status', 'Escolha uma situação válida para a obra.')
  }

  const numbers = {} as Record<'episodes' | 'duration' | 'year', number | null>
  for (const [field, min, max] of [['episodes', 1, 2147483647], ['duration', 1, 1440], ['year', 1900, 2200]] as const) {
    const raw = fields[field]
    if (raw === undefined || raw === null || raw === '') {
      numbers[field] = null
    } else if (typeof raw === 'number' && Number.isInteger(raw) && raw >= min && raw <= max) {
      numbers[field] = raw
    } else {
      return invalid(field, `Informe um número inteiro de ${min} a ${max}, ou deixe vazio.`)
    }
  }

  let genres: string[] | null = null
  if (fields.genres !== undefined && fields.genres !== null) {
    if (!Array.isArray(fields.genres) || fields.genres.length > 10) {
      return invalid('genres', 'Informe até 10 gêneros.')
    }
    const unique = new Map<string, string>()
    for (const raw of fields.genres) {
      if (typeof raw !== 'string' || [...raw.trim()].length > 40 || /[\u0000-\u001f\u007f]/.test(raw)) {
        return invalid('genres', 'Cada gênero deve ter até 40 caracteres válidos.')
      }
      const value = raw.trim()
      if (value) {
        const key = value.toLocaleLowerCase('pt-BR')
        if (!unique.has(key)) unique.set(key, value)
      }
    }
    genres = unique.size ? [...unique.values()] : null
  }

  // Whitelist content fields. Identity, publication and reviewer fields from the
  // caller never become part of a validated editorial draft.
  return { data: {
    title: text.title,
    title_english: text.title_english,
    title_native: text.title_native,
    description: text.description,
    source_url: text.source_url,
    rights_note: text.rights_note,
    format: fields.format as CatalogAnimeDraft['format'],
    status: fields.status as CatalogAnimeDraft['status'],
    ...numbers,
    genres,
  } }
}

function invalid(field: DraftField, error: string): DraftError {
  return { error, code: 'INVALID_INPUT', field }
}
