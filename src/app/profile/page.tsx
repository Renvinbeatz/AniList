import { ProfileSocialLinks } from '@/components/profile/ProfileSocialLinks'
import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import { ProfileBanner } from '@/components/profile/ProfileBanner'
import { ProfileHighlights } from '@/components/profile/ProfileHighlights'
import { getProfileCollections } from '@/actions/profile'
import { resolveFavoriteCharacter } from '@/data/profile-character'
import { publicProfilePath } from '@/lib/public-profile'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { supabaseServerClient } from '@/data/supabase'
import { getLibrary } from '@/actions/library'
import { Navigation } from '@/components/Navigation'
import { LIBRARY_STATUS } from '@/lib/constants'
import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { logoutAction } from '@/actions/auth'
import { EmptyState } from '@/components/ui/empty-state'
import { PosterCard } from '@/components/anime/PosterCard'

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) {
    redirect('/')
  }

  // 1. Fetch Profile Data
  const { data: profile } = await supabaseServerClient
    .from('profiles')
    .select('*')
    .eq('id', session.profileId)
    .single()

  if (!profile) {
    redirect('/')
  }

  // 2. Fetch Library Data for Statistics & Preview
  const [{ data: library }, collections, favorite] = await Promise.all([
    getLibrary(), getProfileCollections(), resolveFavoriteCharacter(profile.favorite_character_anilist_id)
  ])
  const libraryItems = library || []

  // Calculate statistics
  const totalAnime = libraryItems.length
  const watchingCount = libraryItems.filter(item => item.status === LIBRARY_STATUS.WATCHING).length
  const completedCount = libraryItems.filter(item => item.status === LIBRARY_STATUS.COMPLETED).length

  // Get recent 4-6 items for preview
  const recentItems = libraryItems.slice(0, 6)

  // Identity
  const displayName = profile.display_name || profile.username

  return (
    <>
      <Navigation />

      <main id="main-content" className="min-h-screen pb-32 md:pb-16 pt-24 md:pt-32 relative selection:bg-accent/30 animate-in fade-in slide-in-from-bottom-2 duration-320 ease-cinema">
        <div className="absolute inset-0 pointer-events-none z-[-2] bg-background" />

        <div className="container mx-auto max-w-[800px] px-4 sm:px-6 md:px-8 space-y-16">

          {/* HERO / IDENTIDADE */}
          <section className="space-y-6">
            <ProfileBanner key={profile.banner_url} url={profile.banner_url} />
            <div className="flex flex-col items-center text-center space-y-6">
              <ProfileAvatar preset={profile.avatar_preset} className="h-20 w-20 md:h-24 md:w-24" />

              <div className="space-y-1">
                <h1 className="max-w-full break-all text-h1 font-semibold tracking-tight text-foreground">
                  {displayName}
                </h1>
                {profile.display_name && (
                  <h2 className="text-body text-muted-foreground">@{profile.username}</h2>
                )}
              </div>

              {profile.bio && <p className="max-w-full whitespace-pre-wrap break-words text-body text-muted-foreground">{profile.bio}</p>}

              {/* ESTATÍSTICAS EDITORIAIS */}
              <div className="text-body text-muted-foreground">
                {totalAnime > 0 ? (
                  <span className="flex items-center gap-2">
                    <span>{totalAnime} na coleção</span>
                    <span>&middot;</span>
                    <span>{watchingCount} assistindo</span>
                    <span className="hidden sm:inline">&middot;</span>
                    <span className="hidden sm:inline">{completedCount} concluídos</span>
                  </span>
                ) : (
                  <span>Nenhum anime na coleção</span>
                )}
              </div>
            </div>
          </section>

          <ProfileSocialLinks links={profile.social_links} />
          <ProfileHighlights collections={collections} favorite={favorite} />

          {/* PRÉVIA DA COLEÇÃO */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <h2 className="text-body font-medium text-muted-foreground">Sua coleção</h2>
              {recentItems.length > 0 && (
                <Link href="/library" className="text-small text-muted-foreground hover:text-foreground transition-colors">
                  Ver tudo
                </Link>
              )}
            </div>

            {recentItems.length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-x-3 gap-y-6 md:gap-x-4 md:gap-y-8">
                {recentItems.map((item) => {
                  const anime = item.anime
                  if (!anime) return null

                  return (
                    <PosterCard
                      key={item.id}
                      href={`/anime/${anime.anilist_id}`}
                      imageUrl={anime.cover_image}
                      title={anime.title_romaji || anime.title_english || anime.title_native}
                    />
                  )
                })}
              </div>
            ) : (
              <EmptyState
                title="Sua biblioteca está vazia."
                description="Adicione obras à sua coleção para acompanhá-las por aqui."
              />
            )}
          </section>

          {/* CONFIGURAÇÕES E AÇÕES */}
          <section className="space-y-6 pt-4">
            <h2 className="text-body font-medium text-muted-foreground border-b border-border/50 pb-2">Conta</h2>

            <div className="flex flex-col gap-2">
              <Link href={publicProfilePath(profile.username)} prefetch={false}
                className="flex h-12 items-center justify-center rounded-full border border-border px-6 text-small hover:bg-surface-2">
                Ver página do perfil
              </Link>
              <Link
                href="/profile/settings"
                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 h-12 rounded-full bg-surface-2 hover:bg-surface-3 text-foreground transition-colors text-small font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Editar Perfil
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-6 h-12 rounded-full bg-transparent hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors text-small font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <LogOut className="w-4 h-4" />
                  Sair da conta
                </button>
              </form>
            </div>
          </section>

        </div>
      </main>
    </>
  )
}
