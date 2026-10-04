import { supabaseServerClient } from '@/data/supabase'
import { Tables } from '@/data/database.types'

export type Platform = Tables<'platforms'>

const DEFAULT_PLATFORMS = [
  { name: 'Netflix', website_url: 'https://netflix.com' },
  { name: 'Crunchyroll', website_url: 'https://crunchyroll.com' },
  { name: 'Prime Video', website_url: 'https://primevideo.com' },
  { name: 'Disney+', website_url: 'https://disneyplus.com' },
  { name: 'Max', website_url: 'https://max.com' },
  { name: 'HIDIVE', website_url: 'https://hidive.com' },
  { name: 'YouTube', website_url: 'https://youtube.com' }
]

export async function getAvailablePlatforms(): Promise<Platform[]> {
  const { data: platforms, error } = await supabaseServerClient
    .from('platforms')
    .select('*')
    .order('name')

  if (error) {
    console.error('getAvailablePlatforms error:', error)
    return []
  }

  // Se não houver plataformas cadastradas, faz o seed
  if (platforms.length === 0) {
    const { data: inserted, error: insertError } = await supabaseServerClient
      .from('platforms')
      .insert(DEFAULT_PLATFORMS)
      .select('*')
      .order('name')

    if (insertError) {
      console.error('Seed platforms error:', insertError)
      return []
    }
    return inserted
  }

  return platforms
}

export type UserAnimePlatform = {
  id: string
  platform_id: string
  platform: Platform
}

export async function getUserAnimePlatforms(profileId: string, anilistId: number): Promise<UserAnimePlatform[]> {
  // Para garantir segurança, não aceitamos ID do client direto.
  // Buscamos via profile_id e anilist_id para confirmar propriedade.
  const { data, error } = await supabaseServerClient
    .from('user_anime_platforms')
    .select(`
      id,
      platform_id,
      platform:platforms (
        id, name, logo_url, website_url
      ),
      user_anime!inner (
        id, profile_id,
        anime!inner (
          anilist_id
        )
      )
    `)
    .eq('user_anime.profile_id', profileId)
    .eq('user_anime.anime.anilist_id', anilistId)

  if (error) {
    console.error('getUserAnimePlatforms error:', error)
    return []
  }

  // Transforma o array 'platform' em objeto único
  return (data as unknown as { id: string, platform_id: string, platform: Platform | Platform[] }[]).map(row => ({
    id: row.id,
    platform_id: row.platform_id,
    platform: Array.isArray(row.platform) ? row.platform[0] : row.platform
  }))
}
