'use server'

import { fetchAniList } from '@/lib/anilist/client'
import { SEARCH_ANIME_QUERY, GET_ANIME_BY_ID_QUERY } from '@/lib/anilist/queries'
import { AniListSearchResponse, AniListSingleResponse } from '@/lib/anilist/types'
import { normalizeAnime } from '@/lib/anilist/normalize'
import { supabaseServerClient } from '@/data/supabase'
import { Tables } from '@/data/database.types'

export type AnimeRecord = Tables<'anime'>

/**
 * Pesquisa anime na AniList e retorna os resultados normalizados.
 * Não salva no banco.
 */
export async function searchAnimeAction(query: string) {
  if (!query || query.trim().length === 0) {
    return { error: 'A pesquisa não pode estar vazia.' }
  }

  try {
    const response = await fetchAniList<AniListSearchResponse>(SEARCH_ANIME_QUERY, {
      search: query.trim(),
      page: 1,
      perPage: 15
    })

    const mediaList = response.data?.Page?.media || []
    
    // Filtramos itens mal formatados e normalizamos
    const results = mediaList
      .filter(item => item && item.id)
      .map(normalizeAnime)

    return { results }
  } catch (error: unknown) {
    console.error('Search Error:', error)
    return { error: error instanceof Error ? error.message : 'Erro desconhecido ao pesquisar anime.' }
  }
}

/**
 * Busca anime pelo AniList ID.
 * Primeiro no banco local. Se não achar, busca na AniList, salva e retorna.
 */
export async function ensureAnimeAction(anilistId: number): Promise<{ data?: AnimeRecord; error?: string }> {
  try {
    // 1. Procurar no banco local
    const { data: localAnime, error: selectError } = await supabaseServerClient
      .from('anime')
      .select('*')
      .eq('anilist_id', anilistId)
      .single()

    if (localAnime) {
      return { data: localAnime }
    }

    if (selectError && selectError.code !== 'PGRST116') {
      // Falha genuína de banco (não é "not found")
      console.error('Database select error:', selectError)
      return { error: 'Falha ao acessar o catálogo local.' }
    }

    // 2. Não existe no banco local. Buscar na AniList
    const response = await fetchAniList<AniListSingleResponse>(GET_ANIME_BY_ID_QUERY, {
      id: anilistId
    })

    const media = response.data?.Media
    if (!media) {
      return { error: 'Anime não encontrado na base externa (AniList).' }
    }

    // 3. Normalizar
    const normalized = normalizeAnime(media)

    // 4. Salvar no Supabase
    const { data: newAnime, error: insertError } = await supabaseServerClient
      .from('anime')
      .upsert(normalized, { onConflict: 'anilist_id' })
      .select('*')
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      return { error: 'Não foi possível salvar o anime no catálogo local.' }
    }

    if (!newAnime) {
      return { error: 'Falha desconhecida ao inserir anime.' }
    }

    return { data: newAnime }

  } catch (error: unknown) {
    console.error('Ensure Anime Error:', error)
    return { error: error instanceof Error ? error.message : 'Erro inesperado ao sincronizar anime.' }
  }
}
