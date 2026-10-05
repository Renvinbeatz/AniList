export interface AniListAnimeTitle {
  romaji?: string | null
  english?: string | null
  native?: string | null
}

export interface AniListAnimeCoverImage {
  large?: string | null
  extraLarge?: string | null
  color?: string | null
}

export interface AniListAnime {
  id: number
  title?: AniListAnimeTitle | null
  description?: string | null
  coverImage?: AniListAnimeCoverImage | null
  bannerImage?: string | null
  episodes?: number | null
  duration?: number | null
  status?: string | null
  season?: string | null
  seasonYear?: number | null
  averageScore?: number | null
  genres?: string[] | null
  format?: string | null
}

export interface AniListSearchResponse {
  data?: {
    Page?: {
      media?: AniListAnime[] | null
    } | null
  }
  errors?: Array<{ message: string }>
}

export interface AniListSingleResponse {
  data?: {
    Media?: AniListAnime | null
  }
  errors?: Array<{ message: string }>
}

// Normalized Type that matches our DB insert requirements (omitting id, created_at, updated_at)
export interface NormalizedAnimeInsert {
  anilist_id: number
  title_romaji: string | null
  title_english: string | null
  title_native: string | null
  description: string | null
  cover_image: string | null
  cover_color: string | null
  banner_image: string | null
  episodes: number | null
  duration: number | null
  status: string | null
  season: string | null
  season_year: number | null
  average_score: number | null
  genres: string[] | null
  format: string | null
}

// --- Airing schedule ---

// DTO externo: formato bruto retornado pela AniList (airingAt = Unix timestamp em segundos).
export interface AniListAiringSchedule {
  id?: number | null
  episode?: number | null
  airingAt?: number | null
  mediaId?: number | null
}

export interface AniListAiringResponse {
  data?: {
    Page?: {
      airingSchedules?: AniListAiringSchedule[] | null
    } | null
  }
  errors?: Array<{ message: string }>
}

// Modelo interno compatível com o insert/upsert de `airing_schedule` (sem `anime_id`, resolvido pelo serviço).
export interface NormalizedAiring {
  anilist_airing_id: number
  episode: number
  /** ISO 8601 em UTC (ex.: 2026-10-10T15:00:00.000Z) — armazenado em timestamptz. */
  airing_at: string
}
