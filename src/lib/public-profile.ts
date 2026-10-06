import type { ProfileSocialLinks } from './profile-social-links'
import type { ProfileCollectionItem } from './profile-collections'

export type PublicProfile = {
  social_links: ProfileSocialLinks | null
  username: string
  display_name: string | null
  bio: string | null
  banner_url: string | null
  avatar_preset: string | null
  favorite_character_anilist_id: number | null
  profile_visibility: 'public' | 'private'
  is_owner: boolean
  collections: { favorites: ProfileCollectionItem[]; pinned: ProfileCollectionItem[] }
}

export function publicProfilePath(username: string) {
  return `/user/${encodeURIComponent(username)}`
}

export function validPublicUsername(username: unknown): username is string {
  return typeof username === 'string' && [...username].length >= 3 && [...username].length <= 30
    && !/[\u0000-\u001f\u007f/\\]/.test(username)
}

// This Next version supplies percent-encoded dynamic segments.
// Decode once, so a literal percent sequence in a username stays literal.
export function usernameFromRoute(segment: string): string | null {
  try {
    const username = decodeURIComponent(segment)
    return validPublicUsername(username) ? username : null
  } catch {
    return null
  }
}
