import 'server-only'

import { supabaseServerClient } from '@/data/supabase'
import { AniListError, fetchAniList } from '@/lib/anilist/client'
import { SEARCH_ANIME_QUERY, GET_ANIME_BY_ID_QUERY } from '@/lib/anilist/queries'
import { normalizeAnime } from '@/lib/anilist/normalize'
import type { AniListSearchResponse, AniListSingleResponse } from '@/lib/anilist/types'
import { animeCover, animeTitle, isAniListId, type ProfileAnimeSearchResult } from '@/lib/profile-anime'
import type { ProfileCollectionErrorCode } from '@/lib/profile-collections'

function upstreamMessage(error: unknown) {
  if (error instanceof AniListError && error.status === 429) {
    return 'A AniList recebeu muitas buscas. Aguarde um pouco e tente novamente.'
  }
  return 'Não foi possível consultar a AniList agora. Tente novamente.'
}

// Called only after the route has resolved a valid server session.
export async function searchProfileAnime(query: string): Promise<ProfileAnimeSearchResult> {
  try {
    const response = await fetchAniList<AniListSearchResponse>(SEARCH_ANIME_QUERY, {
      search: query, page: 1, perPage: 10
    })
    const media = response.data?.Page?.media
    if (!Array.isArray(media)) throw new Error('Missing AniList search payload')
    return { results: media.filter((item) => item && isAniListId(item.id)).map((item) => {
      const anime = normalizeAnime(item)
      return {
        anilist_id: anime.anilist_id,
        title: animeTitle(anime),
        cover_image: animeCover(anime.cover_image),
        year: anime.season_year
      }
    }) }
  } catch (error) {
    return { error: upstreamMessage(error), code: 'UPSTREAM_ERROR' }
  }
}

type ResolveResult = { animeId: string } | { error: string; code: ProfileCollectionErrorCode }

// Never trusts a title/cover sent by the browser, and never changes user_anime.
// ignoreDuplicates preserves existing catalogue metadata when requests race.
export async function resolveProfileAnime(anilistId: number): Promise<ResolveResult> {
  const local = await supabaseServerClient.from('anime').select('id').eq('anilist_id', anilistId).maybeSingle()
  if (local.error) return { error: 'Não foi possível consultar o catálogo. Tente novamente.', code: 'INTERNAL_ERROR' }
  if (local.data) return { animeId: local.data.id }

  let response: AniListSingleResponse
  try {
    response = await fetchAniList<AniListSingleResponse>(GET_ANIME_BY_ID_QUERY, { id: anilistId })
  } catch (error) {
    if (error instanceof AniListError && error.status === 404) {
      return { error: 'Este anime não foi encontrado na AniList.', code: 'NOT_FOUND' }
    }
    return { error: upstreamMessage(error), code: 'UPSTREAM_ERROR' }
  }
  const media = response.data?.Media
  if (!media || media.id !== anilistId) return { error: 'Este anime não foi encontrado na AniList.', code: 'NOT_FOUND' }

  const inserted = await supabaseServerClient.from('anime')
    .upsert(normalizeAnime(media), { onConflict: 'anilist_id', ignoreDuplicates: true })
    .select('id').maybeSingle()
  if (inserted.error) return { error: 'Não foi possível salvar o anime. Tente novamente.', code: 'INTERNAL_ERROR' }
  if (inserted.data) return { animeId: inserted.data.id }

  // Another request may have inserted the same AniList ID first.
  const concurrent = await supabaseServerClient.from('anime').select('id').eq('anilist_id', anilistId).maybeSingle()
  if (concurrent.error || !concurrent.data) return { error: 'Não foi possível salvar o anime. Tente novamente.', code: 'INTERNAL_ERROR' }
  return { animeId: concurrent.data.id }
}
