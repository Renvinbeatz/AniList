import 'server-only'
import { supabaseServerClient } from './supabase'
import { getSession } from '@/lib/session'
import type { PeoplePage } from '@/lib/social'

export async function getPeople(query: string, username: string | null, mode: 'search' | 'followers' | 'following', page: number): Promise<PeoplePage | null> {
  const session = await getSession()
  const { data, error } = await supabaseServerClient.rpc('social_people', {
    p_actor: session?.profileId ?? null, p_query: query, p_username: username, p_mode: mode, p_page: page,
  })
  if (error) throw new Error('Não foi possível carregar as pessoas agora.')
  return data as unknown as PeoplePage | null
}

export async function getRelationship(username: string) {
  const session = await getSession()
  const { data, error } = await supabaseServerClient.rpc('social_relationship', { p_actor: session?.profileId ?? null, p_username: username })
  if (error) throw new Error('Não foi possível carregar as relações agora.')
  return data as unknown as { following: boolean; followers: number; following_count: number } | null
}
