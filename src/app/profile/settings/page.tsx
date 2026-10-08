import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { supabaseServerClient } from '@/data/supabase'
import { Navigation } from '@/components/Navigation'
import { ProfileSocialLinksEditor } from '@/components/profile/ProfileSocialLinksEditor'
import { ProfileAvatarEditor } from '@/components/profile/ProfileAvatarEditor'
import { ProfileSettingsForm } from '@/components/profile/ProfileSettingsForm'
import { ProfileCollectionsEditor } from '@/components/profile/ProfileCollectionsEditor'
import { ProfileCharacterEditor } from '@/components/profile/ProfileCharacterEditor'
import { resolveFavoriteCharacter } from '@/data/profile-character'
import { getProfileCollections } from '@/actions/profile'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Configurações do perfil',
}

export default async function ProfileSettingsPage() {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  const { data: profile } = await supabaseServerClient
    .from('profiles')
    .select('social_links, avatar_preset, display_name, bio, banner_url, profile_visibility, favorite_character_anilist_id')
    .eq('id', session.profileId)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // Pass plain data to the client component
  const initialData = {
    display_name: profile.display_name,
    bio: profile.bio,
    banner_url: profile.banner_url,
    profile_visibility: profile.profile_visibility as 'public' | 'private'
  }

  const [collections, favoriteCharacter] = await Promise.all([
    getProfileCollections(),
    resolveFavoriteCharacter(profile.favorite_character_anilist_id)
  ])

  return (
    <>
      <Navigation />

      <main id="main-content" className="min-h-screen pb-32 lg:pb-16 pt-24 relative selection:bg-accent/30">
        <div className="absolute inset-0 pointer-events-none z-[-2] bg-background" />

        <div className="container mx-auto max-w-[600px] px-4 sm:px-6 md:px-8 space-y-8">

          <div className="space-y-4">
            <Link
              href="/profile"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Voltar ao perfil
            </Link>

            <h1 className="text-h2 font-semibold tracking-tight text-foreground">
              Configurações
            </h1>
          </div>

          <ProfileAvatarEditor saved={profile.avatar_preset} />
          <ProfileSettingsForm initialData={initialData} />
          <ProfileSocialLinksEditor saved={profile.social_links} />
          <ProfileCharacterEditor favorite={favoriteCharacter} />
          <ProfileCollectionsEditor collections={collections} />

        </div>
      </main>
    </>
  )
}
