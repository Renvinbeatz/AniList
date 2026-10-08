import { platformHttpsUrl } from '@/lib/platforms'

export type StreamingLink = { name: string; url: string; language: string | null }
export type StreamingResult = { links: StreamingLink[]; state: 'available' | 'empty' | 'unavailable' }

const PROVIDERS = [
  { name: 'Netflix', hosts: ['netflix.com'] },
  { name: 'Crunchyroll', hosts: ['crunchyroll.com'] },
  { name: 'Prime Video', hosts: ['primevideo.com', 'amazon.com', 'amazon.com.br'] },
  { name: 'Disney+', hosts: ['disneyplus.com'] },
  { name: 'Max', hosts: ['max.com', 'hbomax.com'] },
  { name: 'HIDIVE', hosts: ['hidive.com'] },
  { name: 'YouTube', hosts: ['youtube.com', 'youtu.be'] },
  { name: 'Hulu', hosts: ['hulu.com'] },
  { name: 'Tubi', hosts: ['tubitv.com'] },
  { name: 'RetroCrush', hosts: ['retrocrush.tv'] },
] as const

export function normalizeStreamingLinks(input: unknown): StreamingLink[] {
  if (!Array.isArray(input)) return []
  const links: StreamingLink[] = [], seen = new Set<string>()
  for (const item of input) {
    if (!item || typeof item !== 'object' || item.type !== 'STREAMING' || item.isDisabled === true) continue
    const url = platformHttpsUrl(item.url)
    if (!url || seen.has(url)) continue
    const hostname = new URL(url).hostname
    const provider = PROVIDERS.find(p => p.hosts.some(host => hostname === host || hostname.endsWith(`.${host}`)))
    if (!provider) continue
    seen.add(url)
    const language = typeof item.language === 'string' && item.language.trim() && item.language.length <= 60
      && !/[\u0000-\u001f\u007f]/u.test(item.language) ? item.language.trim() : null
    links.push({ name: provider.name, url, language })
    if (links.length === 12) break
  }
  return links
}
