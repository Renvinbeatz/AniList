import type { Tables } from '@/data/database.types'

export type ProfileCollectionKind = 'favorites' | 'pinned'
export type ProfileCollectionOperation = 'add' | 'remove' | 'reorder'
export type ProfileCollectionErrorCode =
  | 'INVALID_INPUT'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
  | 'POSITION_CONFLICT'
  | 'INTERNAL_ERROR'
  | 'UNEXPECTED_ERROR'
  | 'UPSTREAM_ERROR'

export type ProfileCollectionResult =
  | { success: true }
  | { error: string; code: ProfileCollectionErrorCode }

export type ProfileCollectionAnime = Pick<
  Tables<'anime'>,
  'id' | 'anilist_id' | 'title_romaji' | 'title_english' | 'title_native' | 'cover_image'
>

// Ownership identifiers are deliberately omitted from client-facing records.
export type ProfileCollectionItem = {
  anime_id: string
  position: number
  anime: ProfileCollectionAnime
}

export type ProfileCollectionsResult =
  | { data: { favorites: ProfileCollectionItem[]; pinned: ProfileCollectionItem[] } }
  | { error: string; code: ProfileCollectionErrorCode }
