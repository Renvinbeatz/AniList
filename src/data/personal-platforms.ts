import 'server-only'
import { supabaseServerClient } from '@/data/supabase'
import type { PersonalPlatform } from '@/lib/platforms'
import { platformHttpsUrl } from '@/lib/platforms'

export async function getPersonalPlatforms(profileId: string): Promise<PersonalPlatform[]> {
  const { data, error } = await supabaseServerClient.from('personal_platforms')
    .select('id, name, website_url').eq('profile_id', profileId).order('name')
  if (error) throw new Error('Não foi possível carregar suas plataformas particulares.')
  return (data ?? []).map(row => ({ ...row, website_url: platformHttpsUrl(row.website_url) }))
}

export async function getPersonalPlatformSelections(profileId: string, userAnimeId: string): Promise<string[]> {
  const { data, error } = await supabaseServerClient.from('user_anime_personal_platforms')
    .select('personal_platform_id').eq('profile_id', profileId).eq('user_anime_id', userAnimeId)
  if (error) throw new Error('Não foi possível carregar suas escolhas de plataformas.')
  return (data ?? []).map(row => row.personal_platform_id)
}
