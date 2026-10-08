export type PersonalPlatform = { id: string; name: string; website_url: string | null }

export function isPlatformId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export function isPlatformAnimeId(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 2147483647
}

export function platformHttpsUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2000 || /[\s\u0000-\u001f\u007f]/u.test(value)) return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || !url.hostname) return null
    return url.href.length <= 2000 ? url.href : null
  } catch { return null }
}

export function validatePersonalPlatform(input: unknown):
  | { data: { name: string; website_url: string | null }; error?: never }
  | { error: string; data?: never } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { error: 'Informe o nome e um link HTTPS opcional.' }
  const raw = input as Record<string, unknown>
  if (Object.keys(raw).some(key => key !== 'name' && key !== 'website_url')) return { error: 'Dados de plataforma inválidos.' }
  if (typeof raw.name !== 'string') return { error: 'Informe um nome de até 60 caracteres.' }
  const name = raw.name.trim()
  if (!name || [...name].length > 60 || /[\u0000-\u001f\u007f-\u009f]/u.test(name)) return { error: 'Informe um nome de até 60 caracteres.' }
  const value = typeof raw.website_url === 'string' ? raw.website_url.trim() : raw.website_url
  if (value === '' || value === undefined || value === null) return { data: { name, website_url: null } }
  const website_url = platformHttpsUrl(value)
  return website_url ? { data: { name, website_url } } : { error: 'Use um link HTTPS válido, sem usuário ou senha.' }
}
