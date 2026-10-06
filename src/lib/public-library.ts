import { LIBRARY_STATUS, type LibraryStatus } from './constants'
import { publicProfilePath } from './public-profile'

export const PUBLIC_LIBRARY_PAGE_SIZE = 24
export type PublicLibraryItem = { anilist_id: number; title: string; cover_image: string | null; status: LibraryStatus }
export type PublicLibrary = {
  username: string
  profile_visibility: 'public' | 'private'
  is_owner: boolean
  counts: Record<LibraryStatus | 'total', number>
  page: number
  page_size: number
  total_items: number
  items: PublicLibraryItem[]
}
export type PublicLibraryFilter = { status: LibraryStatus | null; page: number }

export function validLibraryStatus(status: unknown): status is LibraryStatus {
  return Object.values(LIBRARY_STATUS).some(value => value === status)
}

export function publicLibraryFilter(status: unknown, page: unknown): PublicLibraryFilter | null {
  if (status !== undefined && status !== '' && !validLibraryStatus(status)) return null
  if (page !== undefined && (typeof page !== 'string' || !/^[1-9]\d{0,6}$/.test(page))) return null
  const number = page === undefined ? 1 : Number(page)
  if (number > 1000000) return null
  return { status: status ? status as LibraryStatus : null, page: number }
}

export function publicLibraryPath(username: string, status: LibraryStatus | null = null, page = 1) {
  const query = new URLSearchParams()
  if (status) query.set('status', status)
  if (page > 1) query.set('page', String(page))
  return `${publicProfilePath(username)}/library${query.size ? `?${query}` : ''}`
}
