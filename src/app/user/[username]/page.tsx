import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublicProfile } from '@/data/public-profile'
import { resolveFavoriteCharacter } from '@/data/profile-character'
import { getSession } from '@/lib/session'
import { ProfileSocialLinks } from '@/components/profile/ProfileSocialLinks'
import { ProfileIdentity } from '@/components/profile/ProfileIdentity'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { ProfileHighlights } from '@/components/profile/ProfileHighlights'
import { usernameFromRoute } from '@/lib/public-profile'
import { publicLibraryPath } from '@/lib/public-library'
import { ProfileConnections } from '@/components/social/ProfileConnections'

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
        <Link href="/" aria-label="Anicat — Início" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><BrandLogo /></Link>
        <Link href={session ? '/profile' : '/login'} className="inline-flex min-h-11 items-center rounded-full px-4 text-sm text-muted-foreground hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{session ? 'Meu perfil' : 'Entrar'}</Link>
      </nav>
    </header>
    <main id="main-content" className="mx-auto w-full max-w-[800px] space-y-12 px-4 py-8 pb-16 sm:px-6">
      <ProfileIdentity profile={profile} actions={profile.is_owner ?
        <Link href="/profile/settings" className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface-2 px-5 hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Editar perfil</Link> : undefined
      }>
        {profile.is_owner && profile.profile_visibility === 'private' && <p className="text-sm text-muted-foreground">Perfil privado · Visível apenas para você.</p>}
      </ProfileIdentity>
      <ProfileConnections username={profile.username} owner={profile.is_owner} />
      <ProfileSocialLinks links={profile.social_links} />
      <ProfileHighlights collections={{ data: profile.collections }} favorite={favorite} />
      <Link href={publicLibraryPath(profile.username)} prefetch={false}
        className="flex justify-center rounded-full border border-border px-5 py-3 text-sm hover:bg-surface-2">
        Ver biblioteca
      </Link>
    </main>
  </>
}
