import 'server-only'
import { fetchAniList } from '@/lib/anilist/client'
import { isPlatformAnimeId } from '@/lib/platforms'
import { normalizeStreamingLinks, type StreamingResult } from '@/lib/streaming'

const STREAMING_QUERY = `
  query StreamingLinks($id: Int!) {
    Media(id: $id, type: ANIME) {
      id
      externalLinks { url type language isDisabled }
    }
  }
`

export async function getStreamingLinks(anilistId: number): Promise<StreamingResult> {
  if (!isPlatformAnimeId(anilistId)) return { links: [], state: 'unavailable' }
  try {
    const result = await fetchAniList<{ data?: { Media?: { id: number; externalLinks?: unknown } | null }; errors?: unknown[] }>(STREAMING_QUERY, { id: anilistId })
    if (result.errors?.length || result.data?.Media?.id !== anilistId || !Array.isArray(result.data.Media.externalLinks)) return { links: [], state: 'unavailable' }
    const links = normalizeStreamingLinks(result.data.Media.externalLinks)
    return { links, state: links.length ? 'available' : 'empty' }
  } catch { return { links: [], state: 'unavailable' } }
}
