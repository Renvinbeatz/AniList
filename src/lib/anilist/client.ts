const ANILIST_API_URL = 'https://graphql.anilist.co'
const TIMEOUT_MS = 8000 // 8 segundos de timeout

export class AniListError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'AniListError'
  }
}

export interface FetchAniListOptions {
  /** Ignora o cache de fetch do Next.js (usado pela sincronização de airing). */
  noStore?: boolean
}

export async function fetchAniList<T>(
  query: string,
  variables?: Record<string, unknown>,
  options: FetchAniListOptions = {}
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      signal: controller.signal,
      ...(options.noStore
        ? { cache: 'no-store' as const }
        : { next: { revalidate: 3600 } }) // Faz um cache simples das chamadas no Next.js App Router (opcional para busca, mas ajuda)
    })

    if (!response.ok) {
      if (response.status === 429) {
        throw new AniListError('Rate limit excedido da API da AniList.', 429)
      }
      throw new AniListError(`AniList API Error: ${response.statusText}`, response.status)
    }

    const json = await response.json()

    if (json.errors && json.errors.length > 0) {
      throw new AniListError(`AniList GraphQL Error: ${json.errors[0].message}`)
    }

    return json as T
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AniListError('A requisição para AniList demorou muito tempo (Timeout).')
    }
    if (error instanceof AniListError) {
      throw error
    }
    throw new AniListError(`Falha inesperada ao comunicar com AniList: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    clearTimeout(timeoutId)
  }
}
