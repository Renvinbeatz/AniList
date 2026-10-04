'use server'

import { getSession } from '@/lib/session'
import { supabaseServerClient } from '@/data/supabase'
import { revalidatePath } from 'next/cache'

export async function addPlatformAction(anilistId: number, platformId: string) {
  const session = await getSession()
  if (!session?.profileId) {
    return { error: 'Não autorizado.' }
  }

  // 1. Validar se o anime pertence ao usuário na biblioteca
  const { data: uaData, error: uaError } = await supabaseServerClient
    .from('user_anime')
    .select('id, anime!inner(anilist_id)')
    .eq('profile_id', session.profileId)
    .eq('anime.anilist_id', anilistId)
    .maybeSingle()

  if (uaError || !uaData) {
    return { error: 'Anime não encontrado na sua biblioteca.' }
  }

  const userAnimeId = uaData.id

  // 2. Inserir a plataforma
  const { error: insertError } = await supabaseServerClient
    .from('user_anime_platforms')
    .insert({
      user_anime_id: userAnimeId,
      platform_id: platformId
    })

  if (insertError) {
    // 23505 = unique_violation
    if (insertError.code === '23505') {
      return { error: 'Esta plataforma já está associada a este anime.' }
    }
    return { error: 'Falha ao associar plataforma.' }
  }

  revalidatePath(`/anime/${anilistId}`)
  return { error: null }
}

export async function removePlatformAction(anilistId: number, platformId: string) {
  const session = await getSession()
  if (!session?.profileId) {
    return { error: 'Não autorizado.' }
  }

  const { data: uaData, error: uaError } = await supabaseServerClient
    .from('user_anime')
    .select('id, anime!inner(anilist_id)')
    .eq('profile_id', session.profileId)
    .eq('anime.anilist_id', anilistId)
    .maybeSingle()

  if (uaError || !uaData) {
    return { error: 'Anime não encontrado na sua biblioteca.' }
  }

  const userAnimeId = uaData.id

  // 3. Remover associação
  const { error: deleteError } = await supabaseServerClient
    .from('user_anime_platforms')
    .delete()
    .eq('user_anime_id', userAnimeId)
    .eq('platform_id', platformId)

  if (deleteError) {
    return { error: 'Falha ao remover plataforma.' }
  }

  revalidatePath(`/anime/${anilistId}`)
  return { error: null }
}
