import 'server-only'

import { AniListError, fetchAniList } from '@/lib/anilist/client'
import { SEARCH_CHARACTERS_QUERY, GET_CHARACTER_BY_ID_QUERY } from '@/lib/anilist/queries'
import { animeCover, isAniListId } from '@/lib/profile-anime'
import type { FavoriteCharacterDisplay, ProfileCharacter, ProfileCharacterResult } from '@/lib/profile-character'

type AniListCharacter = {
  id?: number
  name?: { full?: string | null; native?: string | null } | null
  image?: { large?: string | null; medium?: string | null } | null
}

function normalizeCharacter(character: AniListCharacter): ProfileCharacter | null {
  if (!character || !isAniListId(character.id)) return null
  return {
    anilist_id: character.id,
    name: character.name?.full?.trim() || character.name?.native?.trim() || 'Personagem sem nome',
    image: animeCover(character.image?.large || character.image?.medium || null)
  }
}

function unavailable(error: unknown) {
  return error instanceof AniListError && error.status === 429
    ? 'A AniList recebeu muitas buscas. Aguarde um pouco e tente novamente.'
    : 'Não foi possível consultar os personagens na AniList agora. Tente novamente.'
}

// fetchAniList caches successful public responses for an hour, not profile identity.
export async function getProfileCharacter(id: number): Promise<ProfileCharacterResult> {
  if (!isAniListId(id)) return { error: 'Personagem inválido.', code: 'INVALID_INPUT' }
  try {
    const response = await fetchAniList<{ data?: { Character?: AniListCharacter | null } }>(GET_CHARACTER_BY_ID_QUERY, { id })
    const character = response.data?.Character
    const normalized = character ? normalizeCharacter(character) : null
    if (!normalized || normalized.anilist_id !== id) return { error: 'Este personagem não foi encontrado na AniList.', code: 'NOT_FOUND' }
    return { data: normalized }
  } catch (error) {
    if (error instanceof AniListError && error.status === 404) return { error: 'Este personagem não foi encontrado na AniList.', code: 'NOT_FOUND' }
    return { error: unavailable(error), code: 'UPSTREAM_ERROR' }
  }
}

export async function searchProfileCharacters(query: string): Promise<
  { results: ProfileCharacter[] } | { error: string; code: 'UPSTREAM_ERROR' }
> {
  try {
    const response = await fetchAniList<{ data?: { Page?: { characters?: AniListCharacter[] | null } } }>(SEARCH_CHARACTERS_QUERY, { search: query, perPage: 10 })
    const characters = response.data?.Page?.characters
    if (!Array.isArray(characters)) throw new Error('Missing character search payload')
    return { results: characters.map(normalizeCharacter).filter((item): item is ProfileCharacter => item !== null) }
  } catch (error) {
    return { error: unavailable(error), code: 'UPSTREAM_ERROR' }
  }
}

export async function resolveFavoriteCharacter(id: number | null): Promise<FavoriteCharacterDisplay> {
  if (id === null) return { id, character: null, error: null }
  const result = await getProfileCharacter(id)
  return 'data' in result
    ? { id, character: result.data, error: null }
    : { id, character: null, error: 'Seu personagem continua salvo, mas não foi possível carregar os detalhes. Você pode tentar novamente, trocar ou remover.' }
}
