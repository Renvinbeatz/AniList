import { AniListAnime, AniListAiringSchedule, NormalizedAnimeInsert, NormalizedAiring } from './types'

function stripHtml(html: string | null | undefined): string | null {
  if (!html) return null
  return html.replace(/<[^>]*>?/gm, '').trim() || null
}

export function normalizeAnime(anime: AniListAnime): NormalizedAnimeInsert {
  return {
    anilist_id: anime.id,
    title_romaji: anime.title?.romaji?.trim() || null,
    title_english: anime.title?.english?.trim() || null,
    title_native: anime.title?.native?.trim() || null,
    description: stripHtml(anime.description),
    cover_image: anime.coverImage?.extraLarge || anime.coverImage?.large || null,
    cover_color: anime.coverImage?.color || null,
    banner_image: anime.bannerImage || null,
    episodes: anime.episodes ?? null,
    duration: anime.duration ?? null,
    status: anime.status || null,
    season: anime.season || null,
    season_year: anime.seasonYear ?? null,
    average_score: anime.averageScore ?? null,
    genres: anime.genres && anime.genres.length > 0 ? anime.genres : null,
    format: anime.format || null,
  }
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

/**
 * Converte a lista bruta de airing da AniList para o modelo interno.
 *
 * - `airingAt` da AniList é Unix timestamp em segundos (UTC por definição);
 *   `new Date(s * 1000).toISOString()` gera o instante UTC exato, sem offsets fixos.
 * - Itens inválidos (id/episódio/horário ausentes ou fora do formato, ou de outra mídia)
 *   são descartados — nunca são gravados parcialmente.
 * - Duplicatas pelo mesmo `id` dentro da resposta são colapsadas (o upsert em lote
 *   não aceita a mesma chave duas vezes).
 */
export function normalizeAiringSchedule(
  items: AniListAiringSchedule[],
  expectedMediaId: number
): { valid: NormalizedAiring[]; skipped: number } {
  const byId = new Map<number, NormalizedAiring>()
  let skipped = 0

  for (const item of items) {
    if (
      !item ||
      !isPositiveInt(item.id) ||
      !isPositiveInt(item.episode) ||
      !isPositiveInt(item.airingAt) ||
      item.mediaId !== expectedMediaId
    ) {
      skipped++
      continue
    }

    const date = new Date(item.airingAt * 1000)
    if (Number.isNaN(date.getTime())) {
      skipped++
      continue
    }

    byId.set(item.id, {
      anilist_airing_id: item.id,
      episode: item.episode,
      airing_at: date.toISOString(),
    })
  }

  return { valid: Array.from(byId.values()), skipped }
}
