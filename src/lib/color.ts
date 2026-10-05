/**
 * Valida e normaliza uma cor hexadecimal proveniente da AniList.
 * 
 * Regras:
 * - Aceita apenas formato hexadecimal (#RGB, #RRGGBB, etc)
 * - Retorna o fallback oficial caso inválido
 * - Normaliza para uppercase
 */
export function getValidAtmosphereColor(color: string | null | undefined): string {
  const FALLBACK_COLOR = '#7B61FF'
  
  if (!color || typeof color !== 'string') {
    return FALLBACK_COLOR
  }

  const normalized = color.trim().toUpperCase()
  
  // Regex estrita para aceitar apenas hex válido (3, 4, 6 ou 8 caracteres)
  const hexRegex = /^#([0-9A-F]{3}|[0-9A-F]{4}|[0-9A-F]{6}|[0-9A-F]{8})$/i
  
  if (hexRegex.test(normalized)) {
    return normalized
  }
  
  return FALLBACK_COLOR
}

/**
 * Cores discretas para gêneros.
 * Baseadas no Quiet Cinema: Cores escuras e pálidas para o fundo (ex: bg-red-500/10)
 * com texto colorizado sutil.
 */
export const GENRE_COLORS: Record<string, string> = {
  Action: 'text-red-400 border-red-400/20 bg-red-400/10',
  Romance: 'text-pink-400 border-pink-400/20 bg-pink-400/10',
  Comedy: 'text-yellow-400 border-yellow-400/20 bg-yellow-400/10',
  Drama: 'text-blue-400 border-blue-400/20 bg-blue-400/10',
  Fantasy: 'text-purple-400 border-purple-400/20 bg-purple-400/10',
  Horror: 'text-rose-600 border-rose-600/20 bg-rose-600/10',
  'Sci-Fi': 'text-cyan-400 border-cyan-400/20 bg-cyan-400/10',
  Adventure: 'text-teal-400 border-teal-400/20 bg-teal-400/10',
  Mystery: 'text-indigo-400 border-indigo-400/20 bg-indigo-400/10',
  Sports: 'text-orange-400 border-orange-400/20 bg-orange-400/10',
  'Slice of Life': 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10',
}

export function getGenreColor(genre: string): string {
  return GENRE_COLORS[genre] || 'text-muted-foreground border-border bg-surface-1'
}
