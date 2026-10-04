import { supabaseServerClient } from '@/data/supabase'
import { Tables } from '@/data/database.types'
import type { NormalizedAiring } from '@/lib/anilist/types'

export type NextAiring = Pick<Tables<'airing_schedule'>, 'anilist_airing_id' | 'episode' | 'airing_at'>

/**
 * Próximo episódio ainda não lançado de um anime (dados globais do anime, sem relação com profile).
 * Usa somente `airing_at` (timestamptz/UTC) comparado com o instante atual, ordenado do mais próximo.
 * Retorna `null` se não houver episódio futuro ou se a consulta falhar (nunca inventa datas).
 */
export async function getNextAiring(animeId: string): Promise<NextAiring | null> {
  const { data, error } = await supabaseServerClient
    .from('airing_schedule')
    .select('anilist_airing_id, episode, airing_at')
    .eq('anime_id', animeId)
    .gt('airing_at', new Date().toISOString())
    .order('airing_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('getNextAiring error:', error)
    return null
  }

  return data
}

/**
 * Upsert idempotente em lote. A chave de reconciliação é `anilist_airing_id`
 * (UNIQUE no schema), então repetir o sync nunca duplica episódios e
 * execuções concorrentes convergem para o mesmo estado.
 */
export async function upsertAiringSchedule(animeId: string, rows: NormalizedAiring[]): Promise<void> {
  if (rows.length === 0) return

  const { error } = await supabaseServerClient
    .from('airing_schedule')
    .upsert(
      rows.map((row) => ({ ...row, anime_id: animeId })),
      { onConflict: 'anilist_airing_id' }
    )

  if (error) {
    throw new Error(`Falha ao gravar airing_schedule: ${error.message}`)
  }
}

/**
 * Marcador de "última sincronização" sem alterar o schema: o trigger `handle_updated_at`
 * atualiza `updated_at` a cada upsert, então o maior `updated_at` do anime indica o último sync.
 * Retorna `null` se o anime nunca teve airing gravado.
 */
export async function getLastAiringSyncAt(animeId: string): Promise<Date | null> {
  const { data, error } = await supabaseServerClient
    .from('airing_schedule')
    .select('updated_at')
    .eq('anime_id', animeId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Falha ao consultar última sincronização: ${error.message}`)
  }

  return data ? new Date(data.updated_at) : null
}

export type CalendarAiring = {
  anilist_airing_id: number
  episode: number
  airing_at: string
  anime_id: string
  anime: {
    id: string
    anilist_id: number
    title_romaji: string | null
    title_english: string | null
    title_native: string | null
    cover_image: string | null
    banner_image: string | null
    cover_color: string | null
    user_anime: {
      status: string
      current_episode: number
    }[]
  }
}

/**
 * Retorna os episódios programados em uma janela de tempo para os animes
 * que o usuário está 'watching' ou 'planned'.
 */
export async function getCalendarAirings(
  profileId: string,
  startDate: Date,
  endDate: Date
): Promise<CalendarAiring[]> {
  const { data, error } = await supabaseServerClient
    .from('airing_schedule')
    .select(`
      anilist_airing_id, episode, airing_at, anime_id,
      anime!inner (
        id, anilist_id, title_romaji, title_english, title_native, cover_image, banner_image, cover_color,
        user_anime!inner (
          status, current_episode, profile_id
        )
      )
    `)
    .eq('anime.user_anime.profile_id', profileId)
    .in('anime.user_anime.status', ['watching', 'planned'])
    .gte('airing_at', startDate.toISOString())
    .lte('airing_at', endDate.toISOString())
    .order('airing_at', { ascending: true })

  if (error) {
    console.error('getCalendarAirings error:', error)
    return []
  }

  return data as unknown as CalendarAiring[]
}
