'use server'

import { getSession } from '@/lib/session'
import { getCatalogAnime, searchCatalogAnime } from '@/data/catalog'
import type { CatalogError } from '@/lib/catalog'

function unauthorized(): CatalogError {
  return { error: 'Sua sessão expirou. Entre novamente.', code: 'UNAUTHORIZED' }
}

export async function searchCatalogAnimeAction(query: string) {
  if (!await getSession()) return unauthorized()
  return searchCatalogAnime(query)
}

export async function getCatalogAnimeAction(animeId: string) {
  if (!await getSession()) return unauthorized()
  return getCatalogAnime(animeId)
}
