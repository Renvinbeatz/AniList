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
