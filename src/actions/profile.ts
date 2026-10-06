'use server'

import { supabaseServerClient } from '@/data/supabase'
import { getSession } from '@/lib/session'
import { getProfileCharacter } from '@/data/profile-character'
import { revalidatePath } from 'next/cache'
import { Database } from '@/data/database.types'
import type {
  ProfileCollectionKind,
  ProfileCollectionOperation,
  ProfileCollectionResult,
  ProfileCollectionsResult
} from '@/lib/profile-collections'
import {
  validateProfileSettings,
  validateFavoriteInput,
  validatePinnedInput,
  ProfileSettingsInput,
  UUID_REGEX
} from '@/lib/validations/profile'

// ----------------------------------------------------------------------------
// 1. PROFILE SETTINGS
// ----------------------------------------------------------------------------

function revalidateProfileViews() {
  revalidatePath('/profile')
  revalidatePath('/profile/settings')
  revalidatePath('/user/[username]', 'page')
}

export async function updateProfileSettings(input: ProfileSettingsInput) {
  try {
    const session = await getSession()
    if (!session) return { error: 'Usuário não autenticado.', code: 'UNAUTHORIZED' }

    // Input Validation
    const validationError = validateProfileSettings(input)
    if (validationError) return validationError

    if (input.favorite_character_anilist_id !== undefined && input.favorite_character_anilist_id !== null) {
      const character = await getProfileCharacter(input.favorite_character_anilist_id)
      if ('error' in character) return character
    }

    // Mount updates
    const updates: Database['public']['Tables']['profiles']['Update'] = {}
    if (input.avatar_preset !== undefined) updates.avatar_preset = input.avatar_preset
    if (input.display_name !== undefined) updates.display_name = input.display_name === '' ? null : input.display_name
    if (input.bio !== undefined) updates.bio = input.bio === '' ? null : input.bio
    if (input.banner_url !== undefined) updates.banner_url = input.banner_url === '' ? null : input.banner_url
    if (input.favorite_character_anilist_id !== undefined) updates.favorite_character_anilist_id = input.favorite_character_anilist_id
    if (input.profile_visibility !== undefined) updates.profile_visibility = input.profile_visibility

    if (Object.keys(updates).length === 0) return { success: true }

    const { error } = await supabaseServerClient
      .from('profiles')
      .update(updates)
      .eq('id', session.profileId)

    if (error) {
      console.error('Update Profile Error:', error)
      return { error: 'Não foi possível atualizar as configurações do perfil.', code: 'INTERNAL_ERROR' }
    }

    revalidateProfileViews()
    return { success: true }
  } catch (err) {
    console.error('Unexpected Update Profile Error:', err)
    return { error: 'Ocorreu um erro inesperado.', code: 'UNEXPECTED_ERROR' }
  }
}

// Collection mutations share one transaction and lock in PostgreSQL.
// Removing an item leaves its slot empty; reordering to an occupied slot swaps.
async function mutateCollection(
  collection: ProfileCollectionKind,
  operation: ProfileCollectionOperation,
  animeId: string,
  position?: number
): Promise<ProfileCollectionResult> {
  try {
    const session = await getSession()
    if (!session) return { error: 'Usuário não autenticado.', code: 'UNAUTHORIZED' }

    if (operation === 'remove') {
      if (typeof animeId !== 'string' || !UUID_REGEX.test(animeId)) {
        return { error: 'Anime inválido.', code: 'INVALID_INPUT' }
      }
    } else {
      const validate = collection === 'favorites' ? validateFavoriteInput : validatePinnedInput
      const validationError = validate(animeId, position as number)
      if (validationError) return { error: validationError.error, code: 'INVALID_INPUT' }
    }

    const { data: status, error } = await supabaseServerClient.rpc('mutate_profile_collection', {
      p_profile_id: session.profileId,
      p_collection: collection,
      p_operation: operation,
      p_anime_id: animeId,
      ...(operation !== 'remove' ? { p_position: position } : {})
    })

    if (error) {
      console.error('Profile collection mutation failed:', error.code)
      return { error: 'Não foi possível atualizar a coleção. Tente novamente.', code: 'INTERNAL_ERROR' }
    }

    switch (status) {
      case 'OK':
        revalidateProfileViews()
        return { success: true }
      case 'INVALID_INPUT':
        return { error: 'Confira o anime e a posição informados.', code: 'INVALID_INPUT' }
      case 'NOT_FOUND':
        return { error: 'Anime não encontrado nesta operação. Atualize a lista e tente novamente.', code: 'NOT_FOUND' }
      case 'ALREADY_EXISTS':
        return { error: 'Este anime já está nesta coleção.', code: 'ALREADY_EXISTS' }
      case 'POSITION_CONFLICT':
        return { error: 'Esta posição foi ocupada. Atualize a lista e tente novamente.', code: 'POSITION_CONFLICT' }
      default:
        return { error: 'Não foi possível atualizar a coleção. Tente novamente.', code: 'INTERNAL_ERROR' }
    }
  } catch {
    return { error: 'Não foi possível atualizar a coleção. Tente novamente.', code: 'UNEXPECTED_ERROR' }
  }
}

export async function addProfileFavorite(animeId: string, position: number) {
  return mutateCollection('favorites', 'add', animeId, position)
}

export async function removeProfileFavorite(animeId: string) {
  return mutateCollection('favorites', 'remove', animeId)
}

export async function reorderProfileFavorite(animeId: string, newPosition: number) {
  return mutateCollection('favorites', 'reorder', animeId, newPosition)
}

export async function addProfilePinnedAnime(animeId: string, position: number) {
  return mutateCollection('pinned', 'add', animeId, position)
}

export async function removeProfilePinnedAnime(animeId: string) {
  return mutateCollection('pinned', 'remove', animeId)
}

export async function reorderProfilePinnedAnime(animeId: string, newPosition: number) {
  return mutateCollection('pinned', 'reorder', animeId, newPosition)
}

export async function getProfileCollections(): Promise<ProfileCollectionsResult> {
  try {
    const session = await getSession()
    if (!session) return { error: 'Usuário não autenticado.', code: 'UNAUTHORIZED' }

    const columns = 'anime_id, position, anime!inner(id, anilist_id, title_romaji, title_english, title_native, cover_image)' as const
    const [favorites, pinned] = await Promise.all([
      supabaseServerClient.from('profile_favorites').select(columns)
        .eq('profile_id', session.profileId).order('position', { ascending: true }),
      supabaseServerClient.from('profile_pinned_anime').select(columns)
        .eq('profile_id', session.profileId).order('position', { ascending: true })
    ])

    if (favorites.error || pinned.error) {
      return { error: 'Não foi possível carregar suas coleções.', code: 'INTERNAL_ERROR' }
    }

    return { data: { favorites: favorites.data ?? [], pinned: pinned.data ?? [] } }
  } catch {
    return { error: 'Não foi possível carregar suas coleções.', code: 'UNEXPECTED_ERROR' }
  }
}
