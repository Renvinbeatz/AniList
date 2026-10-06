import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublicProfile } from '@/data/public-profile'
import { resolveFavoriteCharacter } from '@/data/profile-character'
import { getSession } from '@/lib/session'
import { ProfileSocialLinks } from '@/components/profile/ProfileSocialLinks'
import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import { ProfileBanner } from '@/components/profile/ProfileBanner'
import { ProfileHighlights } from '@/components/profile/ProfileHighlights'
import { usernameFromRoute } from '@/lib/public-profile'
import { publicLibraryPath } from '@/lib/public-library'

// No shared HTML/data cache: every request rechecks visibility and identity.
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Perfil' }

export default async function PublicProfilePage({ params }: PageProps<'/user/[username]'>) {
  const { username: segment } = await params
  const username = usernameFromRoute(segment)
  if (username === null) notFound()
  const result = await getPublicProfile(username)
  if ('error' in result) throw new Error(result.error)
  if (!result.data) notFound()
  const profile = result.data
  const [favorite, session] = await Promise.all([
    resolveFavoriteCharacter(profile.favorite_character_anilist_id), getSession()
  ])
  return <>
    <header className="border-b border-border/40">
      <nav aria-label="Navegação do perfil" className="mx-auto flex max-w-[800px] items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" className="text-lg font-semibold">Tracker</Link>
        <Link href={session ? '/profile' : '/'} className="text-sm text-muted-foreground hover:text-foreground">{session ? 'Meu perfil' : 'Entrar'}</Link>
      </nav>
    </header>
    <main id="main-content" className="mx-auto w-full max-w-[800px] space-y-12 px-4 py-8 pb-16 sm:px-6">
      <section className="space-y-6">
        <ProfileBanner key={profile.banner_url} url={profile.banner_url} />
        <div className="flex flex-col items-center space-y-4 text-center">
          <ProfileAvatar preset={profile.avatar_preset} className="h-24 w-24" />
          <div className="max-w-full space-y-1">
            <h1 className="break-all text-h1 font-semibold">{profile.display_name || profile.username}</h1>
            <p className="break-all text-sm text-muted-foreground">@{profile.username}</p>
          </div>
          {profile.bio && <p className="max-w-full whitespace-pre-wrap break-words text-body text-muted-foreground">{profile.bio}</p>}
          {profile.is_owner && <div className="space-y-3">
            {profile.profile_visibility === 'private' && <p className="text-sm text-muted-foreground">Perfil privado · Visível apenas para você.</p>}
            <Link href="/profile/settings" className="inline-flex rounded-full bg-surface-2 px-5 py-3 text-sm hover:bg-surface-3">Editar perfil</Link>
          </div>}
        </div>
      </section>
      <ProfileSocialLinks links={profile.social_links} />
      <ProfileHighlights collections={{ data: profile.collections }} favorite={favorite} />
      <Link href={publicLibraryPath(profile.username)} prefetch={false}
        className="flex justify-center rounded-full border border-border px-5 py-3 text-sm hover:bg-surface-2">
        Ver biblioteca
      </Link>
    </main>
  </>
}
