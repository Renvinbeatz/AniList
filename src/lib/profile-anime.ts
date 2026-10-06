export type ProfileAnimeOption = {
  anilist_id: number
  title: string
  cover_image: string | null
  year: number | null
}

export type ProfileAnimeSearchResult =
  | { results: ProfileAnimeOption[] }
  | { error: string; code: 'UNAUTHORIZED' | 'INVALID_INPUT' | 'UPSTREAM_ERROR' }

export function isAniListId(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 2147483647
}

export function animeTitle(anime: {
  title_romaji: string | null
  title_english: string | null
  title_native: string | null
}) {
  return anime.title_romaji || anime.title_english || anime.title_native || 'Anime sem título'
}

export function animeCover(url: string | null): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && parsed.hostname === 's4.anilist.co' ? url : null
  } catch {
    return null
  }
}
