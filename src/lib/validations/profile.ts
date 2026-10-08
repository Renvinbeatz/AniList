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
export const AVATAR_EXPRESSIONS = [
  {
    "id": "happy",
    "label": "Feliz"
  },
  {
    "id": "sad",
    "label": "Triste"
  },
  {
    "id": "laughing",
    "label": "Rindo"
  },
  {
    "id": "normal",
    "label": "Normal"
  }
] as const

export const AVATAR_COLORS = [
  {
    "id": "lavender",
    "label": "Lavanda",
    "color": "#B8A6DB"
  },
  {
    "id": "blue",
    "label": "Azul",
    "color": "#91B6D5"
  },
  {
    "id": "sage",
    "label": "Sálvia",
    "color": "#A7C5AF"
  },
  {
    "id": "peach",
    "label": "Pêssego",
    "color": "#E8BE9C"
  },
  {
    "id": "rose",
    "label": "Rosa",
    "color": "#DBA9B6"
  },
  {
    "id": "sand",
    "label": "Areia",
    "color": "#D8D0C3"
  }
] as const

// Legacy IDs keep existing choices valid within the 24-avatar catalog.
export const AVATAR_PRESETS = [
  {
    "id": "happy-lavender",
    "expression": "happy",
    "expressionLabel": "Feliz",
    "background": "lavender",
    "colorLabel": "Lavanda",
    "color": "#B8A6DB",
    "art": "/avatars/cat-happy-lavender.svg",
    "label": "Feliz · Lavanda",
    "description": "Avatar feliz, fundo lavanda"
  },
  {
    "id": "happy-blue",
    "expression": "happy",
    "expressionLabel": "Feliz",
    "background": "blue",
    "colorLabel": "Azul",
    "color": "#91B6D5",
    "art": "/avatars/cat-happy-blue.svg",
    "label": "Feliz · Azul",
    "description": "Avatar feliz, fundo azul"
  },
  {
    "id": "happy-sage",
    "expression": "happy",
    "expressionLabel": "Feliz",
    "background": "sage",
    "colorLabel": "Sálvia",
    "color": "#A7C5AF",
    "art": "/avatars/cat-happy-sage.svg",
    "label": "Feliz · Sálvia",
    "description": "Avatar feliz, fundo sálvia"
  },
  {
    "id": "happy-peach",
    "expression": "happy",
    "expressionLabel": "Feliz",
    "background": "peach",
    "colorLabel": "Pêssego",
    "color": "#E8BE9C",
    "art": "/avatars/cat-happy-peach.svg",
    "label": "Feliz · Pêssego",
    "description": "Avatar feliz, fundo pêssego"
  },
  {
    "id": "happy-rose",
    "expression": "happy",
    "expressionLabel": "Feliz",
    "background": "rose",
    "colorLabel": "Rosa",
    "color": "#DBA9B6",
    "art": "/avatars/cat-happy-rose.svg",
    "label": "Feliz · Rosa",
    "description": "Avatar feliz, fundo rosa"
  },
  {
    "id": "happy-sand",
    "expression": "happy",
    "expressionLabel": "Feliz",
    "background": "sand",
    "colorLabel": "Areia",
    "color": "#D8D0C3",
    "art": "/avatars/cat-happy-sand.svg",
    "label": "Feliz · Areia",
    "description": "Avatar feliz, fundo areia"
  },
  {
    "id": "sad-lavender",
    "expression": "sad",
    "expressionLabel": "Triste",
    "background": "lavender",
    "colorLabel": "Lavanda",
    "color": "#B8A6DB",
    "art": "/avatars/cat-sad-lavender.svg",
    "label": "Triste · Lavanda",
    "description": "Avatar triste, fundo lavanda"
  },
  {
    "id": "sad-blue",
    "expression": "sad",
    "expressionLabel": "Triste",
    "background": "blue",
    "colorLabel": "Azul",
    "color": "#91B6D5",
    "art": "/avatars/cat-sad-blue.svg",
    "label": "Triste · Azul",
    "description": "Avatar triste, fundo azul"
  },
  {
    "id": "sad-sage",
    "expression": "sad",
    "expressionLabel": "Triste",
    "background": "sage",
    "colorLabel": "Sálvia",
    "color": "#A7C5AF",
    "art": "/avatars/cat-sad-sage.svg",
    "label": "Triste · Sálvia",
    "description": "Avatar triste, fundo sálvia"
  },
  {
    "id": "sad-peach",
    "expression": "sad",
    "expressionLabel": "Triste",
    "background": "peach",
    "colorLabel": "Pêssego",
    "color": "#E8BE9C",
    "art": "/avatars/cat-sad-peach.svg",
    "label": "Triste · Pêssego",
    "description": "Avatar triste, fundo pêssego"
  },
  {
    "id": "sad-rose",
    "expression": "sad",
    "expressionLabel": "Triste",
    "background": "rose",
    "colorLabel": "Rosa",
    "color": "#DBA9B6",
    "art": "/avatars/cat-sad-rose.svg",
    "label": "Triste · Rosa",
    "description": "Avatar triste, fundo rosa"
  },
  {
    "id": "sad-sand",
    "expression": "sad",
    "expressionLabel": "Triste",
    "background": "sand",
    "colorLabel": "Areia",
    "color": "#D8D0C3",
    "art": "/avatars/cat-sad-sand.svg",
    "label": "Triste · Areia",
    "description": "Avatar triste, fundo areia"
  },
  {
    "id": "laughing-lavender",
    "expression": "laughing",
    "expressionLabel": "Rindo",
    "background": "lavender",
    "colorLabel": "Lavanda",
    "color": "#B8A6DB",
    "art": "/avatars/cat-laughing-lavender.svg",
    "label": "Rindo · Lavanda",
    "description": "Avatar rindo, fundo lavanda"
  },
  {
    "id": "laughing-blue",
    "expression": "laughing",
    "expressionLabel": "Rindo",
    "background": "blue",
    "colorLabel": "Azul",
    "color": "#91B6D5",
    "art": "/avatars/cat-laughing-blue.svg",
    "label": "Rindo · Azul",
    "description": "Avatar rindo, fundo azul"
  },
  {
    "id": "laughing-sage",
    "expression": "laughing",
    "expressionLabel": "Rindo",
    "background": "sage",
    "colorLabel": "Sálvia",
    "color": "#A7C5AF",
    "art": "/avatars/cat-laughing-sage.svg",
    "label": "Rindo · Sálvia",
    "description": "Avatar rindo, fundo sálvia"
  },
  {
    "id": "laughing-peach",
    "expression": "laughing",
    "expressionLabel": "Rindo",
    "background": "peach",
    "colorLabel": "Pêssego",
    "color": "#E8BE9C",
    "art": "/avatars/cat-laughing-peach.svg",
    "label": "Rindo · Pêssego",
    "description": "Avatar rindo, fundo pêssego"
  },
  {
    "id": "laughing-rose",
    "expression": "laughing",
    "expressionLabel": "Rindo",
    "background": "rose",
    "colorLabel": "Rosa",
    "color": "#DBA9B6",
    "art": "/avatars/cat-laughing-rose.svg",
    "label": "Rindo · Rosa",
    "description": "Avatar rindo, fundo rosa"
  },
  {
    "id": "laughing-sand",
    "expression": "laughing",
    "expressionLabel": "Rindo",
    "background": "sand",
    "colorLabel": "Areia",
    "color": "#D8D0C3",
    "art": "/avatars/cat-laughing-sand.svg",
    "label": "Rindo · Areia",
    "description": "Avatar rindo, fundo areia"
  },
  {
    "id": "purple",
    "expression": "normal",
    "expressionLabel": "Normal",
    "background": "lavender",
    "colorLabel": "Lavanda",
    "color": "#B8A6DB",
    "art": "/avatars/cat-purple.svg",
    "label": "Normal · Lavanda",
    "description": "Avatar normal, fundo lavanda"
  },
  {
    "id": "blue",
    "expression": "normal",
    "expressionLabel": "Normal",
    "background": "blue",
    "colorLabel": "Azul",
    "color": "#91B6D5",
    "art": "/avatars/cat-blue.svg",
    "label": "Normal · Azul",
    "description": "Avatar normal, fundo azul"
  },
  {
    "id": "normal-sage",
    "expression": "normal",
    "expressionLabel": "Normal",
    "background": "sage",
    "colorLabel": "Sálvia",
    "color": "#A7C5AF",
    "art": "/avatars/cat-normal-sage.svg",
    "label": "Normal · Sálvia",
    "description": "Avatar normal, fundo sálvia"
  },
  {
    "id": "normal-peach",
    "expression": "normal",
    "expressionLabel": "Normal",
    "background": "peach",
    "colorLabel": "Pêssego",
    "color": "#E8BE9C",
    "art": "/avatars/cat-normal-peach.svg",
    "label": "Normal · Pêssego",
    "description": "Avatar normal, fundo pêssego"
  },
  {
    "id": "normal-rose",
    "expression": "normal",
    "expressionLabel": "Normal",
    "background": "rose",
    "colorLabel": "Rosa",
    "color": "#DBA9B6",
    "art": "/avatars/cat-normal-rose.svg",
    "label": "Normal · Rosa",
    "description": "Avatar normal, fundo rosa"
  },
  {
    "id": "black",
    "expression": "normal",
    "expressionLabel": "Normal",
    "background": "sand",
    "colorLabel": "Areia",
    "color": "#D8D0C3",
    "art": "/avatars/cat-black.svg",
    "label": "Normal · Areia",
    "description": "Avatar normal, fundo areia"
  }
] as const

export function resolveAvatarPreset(preset: string | null) {
  return AVATAR_PRESETS.find(avatar => avatar.id === preset) ?? AVATAR_PRESETS.find(avatar => avatar.id === 'black')!
}

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
