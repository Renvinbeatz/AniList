/**
 * Profile Settings Input Semantics:
 *
 * - `display_name`:
 *   - `null` ou `""`: Limpa o campo no banco (salva como null).
 *   - `string`: Atualiza com o valor fornecido (max 50 chars).
 *
 * - `bio`:
 *   - `null` ou `""`: Limpa o campo no banco (salva como null).
 *   - `string`: Atualiza com o valor fornecido (max 500 chars).
 *
 * - `banner_url`:
 *   - `null` ou `""`: Limpa o campo no banco (remove o banner, salva como null).
 *   - `string`: Atualiza com o valor fornecido (deve ser HTTPS válido).
 *
 * - `favorite_character_anilist_id`:
 *   - `null`: Limpa o campo no banco (remove o personagem favorito).
 *   - `number`: Atualiza com o ID inteiro e positivo fornecido.
 */
export const AVATAR_PRESETS = [
  { id: 'black', label: 'Preto', color: '#17191f' },
  { id: 'blue', label: 'Azul', color: '#243c58' },
  { id: 'purple', label: 'Roxo', color: '#483453' },
] as const

export type AvatarPreset = typeof AVATAR_PRESETS[number]['id']

export type ProfileSettingsInput = {
  avatar_preset?: AvatarPreset | null
  display_name?: string | null
  bio?: string | null
  banner_url?: string | null
  favorite_character_anilist_id?: number | null
  profile_visibility?: 'public' | 'private'
}

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidHttpUrl(str: string) {
  try {
    const url = new URL(str);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateProfileSettings(input: ProfileSettingsInput) {
  if (input.avatar_preset !== undefined && input.avatar_preset !== null && !AVATAR_PRESETS.some(preset => preset.id === input.avatar_preset)) {
    return { error: 'Escolha um avatar do catálogo.', code: 'INVALID_INPUT' }
  }
  if (input.display_name !== undefined && input.display_name !== null) {
    if (typeof input.display_name !== 'string' || [...input.display_name].length > 50) {
      return { error: 'O nome de exibição deve ter no máximo 50 caracteres.', code: 'INVALID_INPUT' }
    }
  }

  if (input.bio !== undefined && input.bio !== null) {
    if (typeof input.bio !== 'string' || [...input.bio].length > 500) {
      return { error: 'A bio deve ter no máximo 500 caracteres.', code: 'INVALID_INPUT' }
    }
  }

  if (input.banner_url !== undefined && input.banner_url !== null && input.banner_url !== '') {
    if (typeof input.banner_url !== 'string' || input.banner_url.length > 2000) {
      return { error: 'A URL do banner é muito longa.', code: 'INVALID_INPUT' }
    }
    if (!isValidHttpUrl(input.banner_url)) {
      return { error: 'A URL do banner deve ser um link HTTPS válido.', code: 'INVALID_INPUT' }
    }
  }

  if (input.favorite_character_anilist_id !== undefined && input.favorite_character_anilist_id !== null) {
    if (!Number.isInteger(input.favorite_character_anilist_id) || input.favorite_character_anilist_id <= 0 || input.favorite_character_anilist_id > 2147483647) {
      return { error: 'ID de personagem inválido.', code: 'INVALID_INPUT' }
    }
  }

  if (input.profile_visibility !== undefined) {
    if (input.profile_visibility !== 'public' && input.profile_visibility !== 'private') {
      return { error: 'Visibilidade de perfil inválida.', code: 'INVALID_INPUT' }
    }
  }

  return null // no error
}

export function validateFavoriteInput(animeId: string, position: number) {
  if (typeof animeId !== 'string' || !UUID_REGEX.test(animeId)) {
    return { error: 'Anime inválido.', code: 'INVALID_INPUT' }
  }
  if (!Number.isInteger(position) || position < 1 || position > 10) {
    return { error: 'Posição inválida. Escolha de 1 a 10.', code: 'INVALID_INPUT' }
  }
  return null
}

export function validatePinnedInput(animeId: string, position: number) {
  if (typeof animeId !== 'string' || !UUID_REGEX.test(animeId)) {
    return { error: 'Anime inválido.', code: 'INVALID_INPUT' }
  }
  if (!Number.isInteger(position) || position < 1 || position > 6) {
    return { error: 'Posição inválida. Escolha de 1 a 6.', code: 'INVALID_INPUT' }
  }
  return null
}
