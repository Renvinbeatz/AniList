'use server'

import { getSession } from '@/lib/session'
import { supabaseServerClient } from '@/data/supabase'
import { resolveProfileAnime } from '@/data/profile-anime'
import { isAniListId } from '@/lib/profile-anime'
import { addProfileFavorite, addProfilePinnedAnime } from '@/actions/profile'
import type { ProfileCollectionKind, ProfileCollectionResult } from '@/lib/profile-collections'

export async function addCollectionAnime(
  collection: ProfileCollectionKind,
  anilistId: number,
  position: number
): Promise<ProfileCollectionResult> {
  try {
    const session = await getSession()
    if (!session) return { error: 'Sua sessão expirou. Entre novamente.', code: 'UNAUTHORIZED' }
    if ((collection !== 'favorites' && collection !== 'pinned') || !isAniListId(anilistId)
      || !Number.isInteger(position) || position < 1 || position > (collection === 'favorites' ? 10 : 6)) {
      return { error: 'Confira o anime e a posição escolhidos.', code: 'INVALID_INPUT' }
    }

    const table = collection === 'favorites' ? 'profile_favorites' : 'profile_pinned_anime'
    const existing = await supabaseServerClient.from(table).select('position, anime!inner(anilist_id)')
      .eq('profile_id', session.profileId)
    if (existing.error) return { error: 'Não foi possível consultar sua coleção. Tente novamente.', code: 'INTERNAL_ERROR' }
    if (existing.data?.some((item) => item.anime.anilist_id === anilistId)) {
      return { error: 'Este anime já está nesta coleção.', code: 'ALREADY_EXISTS' }
    }
    if (existing.data?.some((item) => item.position === position)) {
      return { error: 'Esta posição foi ocupada. Atualize a lista e tente novamente.', code: 'POSITION_CONFLICT' }
    }

    const resolved = await resolveProfileAnime(anilistId)
    if ('error' in resolved) return resolved
    // Stage 1 performs the authoritative, atomic slot check again after resolution.
    return collection === 'favorites'
      ? await addProfileFavorite(resolved.animeId, position)
      : await addProfilePinnedAnime(resolved.animeId, position)
  } catch {
    return { error: 'Não foi possível adicionar o anime. Tente novamente.', code: 'UNEXPECTED_ERROR' }
  }
}
