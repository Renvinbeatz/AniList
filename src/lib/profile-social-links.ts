export const SOCIAL_PLATFORMS = [
  { id: 'instagram', label: 'Instagram', hosts: ['instagram.com', 'www.instagram.com'] },
  { id: 'x', label: 'X', hosts: ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'] },
  { id: 'youtube', label: 'YouTube', hosts: ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'] },
  { id: 'discord', label: 'Discord', hosts: ['discord.com', 'www.discord.com', 'discord.gg'] },
  { id: 'github', label: 'GitHub', hosts: ['github.com', 'www.github.com'] },
] as const

export type SocialPlatform = typeof SOCIAL_PLATFORMS[number]['id']
export type ProfileSocialLinks = Partial<Record<SocialPlatform, string>>

export function parseProfileSocialLinks(input: unknown):
  { data: ProfileSocialLinks | null } | { error: string; code: 'INVALID_INPUT' } {
  const invalid = { error: 'Informe links HTTPS válidos das plataformas indicadas, com até 2000 caracteres cada.', code: 'INVALID_INPUT' as const }
  if (input === null) return { data: null }
  if (!input || typeof input !== 'object' || Array.isArray(input)
    || Object.keys(input).some(key => !SOCIAL_PLATFORMS.some(platform => platform.id === key))) return invalid
  const links: ProfileSocialLinks = {}
  for (const platform of SOCIAL_PLATFORMS) {
    const value = (input as Record<string, unknown>)[platform.id]
    if (value === undefined || value === null || value === '') continue
    if (typeof value !== 'string') return invalid
    const trimmed = value.trim()
    if (!trimmed) continue
    if (trimmed.length > 2000 || /[\s\u0000-\u001f\u007f]/.test(trimmed) || /%(?:00|0a|0d)/i.test(trimmed)) return invalid
    try {
      const url = new URL(trimmed)
      if (url.protocol !== 'https:' || url.username || url.password || url.port
        || !(platform.hosts as readonly string[]).includes(url.hostname) || url.href.length > 2000) return invalid
      links[platform.id] = url.href
    } catch {
      return invalid
    }
  }
  return { data: Object.keys(links).length ? links : null }
}
