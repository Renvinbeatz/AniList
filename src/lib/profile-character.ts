export type ProfileCharacter = {
  anilist_id: number
  name: string
  image: string | null
}

export type ProfileCharacterResult =
  | { data: ProfileCharacter }
  | { error: string; code: 'INVALID_INPUT' | 'NOT_FOUND' | 'UPSTREAM_ERROR' }

export type FavoriteCharacterDisplay = {
  id: number | null
  character: ProfileCharacter | null
  error: string | null
}
