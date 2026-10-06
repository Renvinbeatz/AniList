import 'server-only'
import { createClient as createAnonymousClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { getSession } from '@/lib/session'
import type { Database } from './database.types'
import { validPublicUsername } from '@/lib/public-profile'
import { isAniListId } from '@/lib/profile-anime'
import { PUBLIC_LIBRARY_PAGE_SIZE, validLibraryStatus, type PublicLibrary, type PublicLibraryFilter } from '@/lib/public-library'

export async function getPublicLibrary(username: string, filter: PublicLibraryFilter): Promise<
  { data: PublicLibrary | null } | { error: string }
> {
  if (!validPublicUsername(username) || (filter.status !== null && !validLibraryStatus(filter.status))
    || !Number.isInteger(filter.page) || filter.page < 1 || filter.page > 1000000) return { data: null }
  try {
    const session = await getSession()
    const client = session ? await createClient() : createAnonymousClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )
    const { data, error } = await client.rpc('read_public_library', {
      p_username: username, p_status: filter.status, p_page: filter.page,
    })
    if (error) return { error: 'Não foi possível carregar a biblioteca agora.' }
    if (data === null) return { data: null }
    const library = data as unknown as PublicLibrary
    if (!library || typeof library.username !== 'string' || typeof library.is_owner !== 'boolean'
      || !['public', 'private'].includes(library.profile_visibility)
      || (library.profile_visibility === 'private' && (!session || !library.is_owner))
      || library.page_size !== PUBLIC_LIBRARY_PAGE_SIZE || !Number.isSafeInteger(library.page) || library.page < 1
      || !Number.isSafeInteger(library.total_items) || library.total_items < 0
      || !library.counts || !['total', 'watching', 'planned', 'paused', 'completed', 'dropped'].every(key => {
        const count = library.counts[key as keyof PublicLibrary['counts']]
        return Number.isSafeInteger(count) && count >= 0
      }) || !Array.isArray(library.items) || library.items.length > PUBLIC_LIBRARY_PAGE_SIZE
      || !library.items.every(item => isAniListId(item?.anilist_id) && typeof item.title === 'string'
        && (item.cover_image === null || typeof item.cover_image === 'string') && validLibraryStatus(item.status))) {
      return { error: 'Não foi possível carregar a biblioteca agora.' }
    }
    return { data: {
      username: library.username, profile_visibility: library.profile_visibility, is_owner: library.is_owner,
      counts: { total: library.counts.total, watching: library.counts.watching, planned: library.counts.planned,
        paused: library.counts.paused, completed: library.counts.completed, dropped: library.counts.dropped },
      page: library.page, page_size: library.page_size, total_items: library.total_items,
      items: library.items.map(item => ({ anilist_id: item.anilist_id, title: item.title, cover_image: item.cover_image, status: item.status })),
    } }
  } catch {
    return { error: 'Não foi possível carregar a biblioteca agora.' }
  }
}
