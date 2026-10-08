'use server'

import { getSession } from '@/lib/session'
import { supabaseServerClient } from '@/data/supabase'
import { revalidatePath } from 'next/cache'
import { isPlatformId, isPlatformAnimeId, validatePersonalPlatform } from '@/lib/platforms'

function refreshPlatforms() { revalidatePath('/anime', 'layout') }

export async function savePersonalPlatformAction(input: unknown, platformId?: string) {
  const session = await getSession()
  if (!session) return { error: 'Não autorizado.' }
  const parsed = validatePersonalPlatform(input)
  if (!parsed.data) return { error: parsed.error }
  if (platformId !== undefined && !isPlatformId(platformId)) return { error: 'Plataforma inválida.' }
  const result = platformId === undefined
    ? await supabaseServerClient.from('personal_platforms').insert({ ...parsed.data, profile_id: session.profileId }).select('id').single()
    : await supabaseServerClient.from('personal_platforms').update(parsed.data).eq('id', platformId).eq('profile_id', session.profileId).select('id').maybeSingle()
  if (result.error) return { error: result.error.code === '23505' ? 'Você já tem uma plataforma com esse nome.' : 'Não foi possível salvar a plataforma.' }
  if (!result.data) return { error: 'Plataforma não encontrada.' }
  refreshPlatforms()
  return { error: null, id: result.data.id }
}

export async function deletePersonalPlatformAction(platformId: string) {
  const session = await getSession()
  if (!session) return { error: 'Não autorizado.' }
  if (!isPlatformId(platformId)) return { error: 'Plataforma inválida.' }
  const { data, error } = await supabaseServerClient.from('personal_platforms').delete()
    .eq('id', platformId).eq('profile_id', session.profileId).select('id').maybeSingle()
  if (error) return { error: 'Não foi possível excluir a plataforma.' }
  if (!data) return { error: 'Plataforma não encontrada.' }
  refreshPlatforms()
  return { error: null }
}

export async function setPersonalPlatformAction(anilistId: number, platformId: string, selected: boolean) {
  const session = await getSession()
  if (!session) return { error: 'Não autorizado.' }
  if (!isPlatformId(platformId) || !isPlatformAnimeId(anilistId) || typeof selected !== 'boolean') return { error: 'Dados de plataforma inválidos.' }
  const { data: platform, error: platformError } = await supabaseServerClient.from('personal_platforms')
    .select('id').eq('id', platformId).eq('profile_id', session.profileId).maybeSingle()
  if (platformError || !platform) return { error: 'Plataforma não encontrada.' }
  const { data: anime, error: animeError } = await supabaseServerClient.from('user_anime')
    .select('id, anime!inner(anilist_id)').eq('profile_id', session.profileId).eq('anime.anilist_id', anilistId).maybeSingle()
  if (animeError || !anime) return { error: 'Anime não encontrado na sua biblioteca.' }
  const result = selected
    ? await supabaseServerClient.from('user_anime_personal_platforms').upsert({ profile_id: session.profileId, user_anime_id: anime.id, personal_platform_id: platform.id }, { onConflict: 'user_anime_id,personal_platform_id', ignoreDuplicates: true })
    : await supabaseServerClient.from('user_anime_personal_platforms').delete().eq('profile_id', session.profileId).eq('user_anime_id', anime.id).eq('personal_platform_id', platform.id)
  if (result.error) return { error: 'Não foi possível atualizar a escolha de plataforma.' }
  revalidatePath(`/anime/${anilistId}`)
  return { error: null }
}
