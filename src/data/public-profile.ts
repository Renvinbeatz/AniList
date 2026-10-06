import 'server-only'
import { parseProfileSocialLinks } from '@/lib/profile-social-links'
import { createClient as createAnonymousClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { getSession } from '@/lib/session'
import type { Database } from './database.types'
import { validPublicUsername, type PublicProfile } from '@/lib/public-profile'

export async function getPublicProfile(username: string): Promise<
  { data: PublicProfile | null } | { error: string }
> {
  if (!validPublicUsername(username)) return { data: null }
  try {
    const session = await getSession()
    // The service-role client is deliberately not used for the public read.
    const client = session ? await createClient() : createAnonymousClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )
    const { data, error } = await client.rpc('read_public_profile', { p_username: username })
    if (error) return { error: 'Não foi possível carregar o perfil agora.' }
    if (data === null) return { data: null }
    const profile = data as unknown as PublicProfile
    // Fail closed even if the database contract is accidentally weakened later.
    if (!profile || typeof profile.username !== 'string' || typeof profile.is_owner !== 'boolean'
      || !['public', 'private'].includes(profile.profile_visibility)
      || (profile.profile_visibility === 'private' && (!session || !profile.is_owner))
      || !Array.isArray(profile.collections?.favorites) || !Array.isArray(profile.collections?.pinned)) {
      return { error: 'Não foi possível carregar o perfil agora.' }
    }
    const links = parseProfileSocialLinks(profile.social_links)
    if ('error' in links) return { error: 'Não foi possível carregar o perfil agora.' }
    return { data: {
      social_links: links.data,
      username: profile.username, display_name: profile.display_name, bio: profile.bio,
      banner_url: profile.banner_url, avatar_preset: profile.avatar_preset,
      favorite_character_anilist_id: profile.favorite_character_anilist_id,
      profile_visibility: profile.profile_visibility, is_owner: profile.is_owner,
      collections: profile.collections,
    } }
  } catch {
    return { error: 'Não foi possível carregar o perfil agora.' }
  }
}
