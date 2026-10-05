import { getSession } from '@/lib/session'
import { supabaseServerClient } from '@/data/supabase'
import { redirect } from 'next/navigation'
import { getLibrary } from '@/actions/library'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { LIBRARY_STATUS } from '@/lib/constants'
import { CircleDashed, Bookmark, CircleCheck, Play } from 'lucide-react'
import { Navigation } from '@/components/Navigation'
import { getValidAtmosphereColor } from '@/lib/color'

export default async function DashboardPage() {
  const session = await getSession()

  if (!session?.profileId) {
    redirect('/')
  }

  // Obter o perfil e a biblioteca
  const [profileRes, libraryRes] = await Promise.all([
    supabaseServerClient
      .from('profiles')
      .select('username, display_name')
      .eq('id', session.profileId)
      .single(),
    getLibrary()
  ])

  const profile = profileRes.data
  if (profileRes.error || !profile) {
    redirect('/')
  }

  const library = libraryRes.data || []
  
  // Estatísticas editoriais
  const watchingCount = library.filter(item => item.status === LIBRARY_STATUS.WATCHING).length
  const plannedCount = library.filter(item => item.status === LIBRARY_STATUS.PLANNED).length
  const completedCount = library.filter(item => item.status === LIBRARY_STATUS.COMPLETED).length

  // Listas derivadas para shelves
  const watchingItems = library.filter(item => item.status === LIBRARY_STATUS.WATCHING).slice(0, 10)
  
  const plannedItems = library
    .filter(item => item.status === LIBRARY_STATUS.PLANNED)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 12)

  const completedItems = library
    .filter(item => item.status === LIBRARY_STATUS.COMPLETED)
    .sort((a, b) => {
      const dateA = a.completed_at ? new Date(a.completed_at).getTime() : 0
      const dateB = b.completed_at ? new Date(b.completed_at).getTime() : 0
      return dateB - dateA
    })
    .slice(0, 12)

  const mainWatching = watchingItems[0]
  const otherWatching = watchingItems.slice(1)
  
  const atmosphereColor = mainWatching?.anime?.cover_color 
    ? getValidAtmosphereColor(mainWatching.anime.cover_color) 
    : undefined

  return (
    <>
      <Navigation />
      
      <main className="container mx-auto max-w-[1200px] pt-24 md:pt-32 pb-32 md:pb-16 px-4 sm:px-6 md:px-8 space-y-16 md:space-y-24 relative">
        
        {/* ATMOSPHERIC HALO SUTIL PARA O DESTAQUE */}
        {mainWatching && atmosphereColor && (
          <div 
            className="absolute top-[10%] left-[-10%] md:left-[10%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] rounded-full blur-[100px] opacity-[0.05] md:opacity-[0.03] pointer-events-none z-0"
            style={{ backgroundColor: atmosphereColor }}
          />
        )}

        {/* HEADER EDITORIAL */}
        <header className="space-y-2 relative z-10">
          <h1 className="text-h1 text-foreground">
            Olá, {profile.display_name || profile.username}.
          </h1>
          <p className="text-body text-muted-foreground">
            {watchingCount} assistindo &middot; {plannedCount} na lista &middot; {completedCount} concluídos
          </p>
        </header>

        {/* CONTINUAR ASSISTINDO (HERO) */}
        <section className="space-y-8 relative z-10">
          {mainWatching ? (
            <div className="flex flex-col md:flex-row gap-6 md:gap-16 items-start">
              
              {/* POSTER HERO */}
              <Link href={`/anime/${mainWatching.anime!.anilist_id}`} className="w-full md:w-[320px] shrink-0 aspect-[2/3] relative rounded-md overflow-hidden bg-surface-2 group">
                {mainWatching.anime!.cover_image ? (
                  <Image 
                    src={mainWatching.anime!.cover_image} 
                    alt="Capa" 
                    fill 
                    sizes="(max-width: 768px) 100vw, 320px" 
                    className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]" 
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-small">Sem capa</div>
                )}
                
                {/* Overlay sutil para hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-220" />
              </Link>
              
              {/* INFO HERO */}
              <div className="flex flex-col gap-6 md:gap-8 pt-2 md:pt-12 flex-1">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-small text-foreground font-medium">
                    <CircleDashed className="w-4 h-4" />
                    <span>Assistindo</span>
                  </div>
                  
                  <Link href={`/anime/${mainWatching.anime!.anilist_id}`} className="block group">
                    <h2 className="text-h1 md:text-display text-foreground leading-tight group-hover:opacity-80 transition-opacity duration-150">
                      {mainWatching.anime!.title_romaji || mainWatching.anime!.title_english || mainWatching.anime!.title_native}
                    </h2>
                  </Link>
                  
                  <div className="text-body text-muted-foreground">
                    Episódio {mainWatching.current_episode} {mainWatching.anime!.episodes ? `de ${mainWatching.anime!.episodes}` : ''}
                  </div>
                </div>
                
                {/* PROGRESSO */}
                {mainWatching.anime!.episodes && mainWatching.anime!.episodes > 0 && (
                  <div className="w-full max-w-sm h-1.5 bg-border rounded-full overflow-hidden relative">
                    <div 
                      className="h-full bg-accent relative transition-[width] duration-320 ease-cinema" 
                      style={{ width: `${Math.min((mainWatching.current_episode / mainWatching.anime!.episodes) * 100, 100)}%` }}
                    >
                      <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/40 blur-[2px] rounded-full" />
                    </div>
                  </div>
                )}
                
                {/* AÇÃO PRIMÁRIA */}
                <div className="pt-2">
                  <Button asChild className="bg-accent hover:bg-accent/90 text-white rounded-full px-8 h-12 font-medium">
                    <Link href={`/anime/${mainWatching.anime!.anilist_id}`}>
                      <Play className="w-4 h-4 mr-2 fill-current" />
                      Continuar
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* ESTADO VAZIO EDITORIAL */
            <div className="py-16 md:py-24 space-y-6">
              <h2 className="text-h2 text-foreground">Nada para continuar por enquanto.</h2>
              <Button asChild variant="secondary" className="rounded-full px-8">
                <Link href="/search">Explorar anime</Link>
              </Button>
            </div>
          )}
        </section>

        {/* OUTROS ANIMES EM ASSISTINDO (SHELF) */}
        {otherWatching.length > 0 && (
          <section className="space-y-6">
            <h3 className="text-h3 text-foreground px-4 sm:px-0">Também assistindo</h3>
            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 md:gap-6 pb-8 px-4 sm:px-0 -mx-4 sm:mx-0">
              {otherWatching.map(item => {
                const anime = item.anime!
                const progressPercent = anime.episodes ? Math.min((item.current_episode / anime.episodes) * 100, 100) : 0
                return (
                  <Link key={item.id} href={`/anime/${anime.anilist_id}`} className="snap-start shrink-0 w-[130px] md:w-[180px] group flex flex-col gap-3">
                    <div className="w-full aspect-[2/3] relative rounded-md overflow-hidden bg-surface-2">
                      {anime.cover_image && (
                        <Image src={anime.cover_image} alt="Capa" fill sizes="180px" className="object-cover transition-transform duration-220 ease-out group-hover:scale-[1.02]" />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-220" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <h4 className="font-medium text-small leading-tight line-clamp-2 text-foreground group-hover:text-foreground/80 transition-opacity duration-150">
                        {anime.title_romaji || anime.title_english || anime.title_native}
                      </h4>
                      <div className="flex justify-between items-center text-caption text-muted-foreground normal-case">
                        <span>Ep {item.current_episode}</span>
                      </div>
                      {anime.episodes && anime.episodes > 0 && (
                        <div className="h-1 w-full bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-accent" style={{ width: `${progressPercent}%` }} />
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* QUERO ASSISTIR (SHELF) */}
        {plannedItems.length > 0 && (
          <section className="space-y-6 pt-8 border-t border-border/30">
            <h2 className="text-h2 text-foreground px-4 sm:px-0">Quero assistir</h2>
            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 md:gap-6 pb-8 px-4 sm:px-0 -mx-4 sm:mx-0">
              {plannedItems.map(item => {
                const anime = item.anime!
                return (
                  <Link key={item.id} href={`/anime/${anime.anilist_id}`} className="snap-start shrink-0 w-[130px] md:w-[180px] group flex flex-col gap-3">
                    <div className="w-full aspect-[2/3] relative rounded-md overflow-hidden bg-surface-2">
                      {anime.cover_image && (
                        <Image src={anime.cover_image} alt="Capa" fill sizes="180px" className="object-cover transition-transform duration-220 ease-out group-hover:scale-[1.02]" />
                      )}
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded text-[10px] font-medium text-white shadow-sm border border-white/10">
                        <Bookmark className="w-3 h-3 text-[#8A8FA3]" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <h4 className="font-medium text-small leading-tight line-clamp-2 text-foreground group-hover:text-foreground/80 transition-opacity duration-150">
                        {anime.title_romaji || anime.title_english || anime.title_native}
                      </h4>
                      <span className="text-caption text-muted-foreground normal-case capitalize">
                        {anime.status?.toLowerCase().replace('_', ' ') || 'TBA'}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* CONCLUÍDOS (SHELF SILENCIOSA) */}
        {completedItems.length > 0 && (
          <section className="space-y-6 pt-8 border-t border-border/30 opacity-90 hover:opacity-100 transition-opacity duration-300">
            <h2 className="text-h2 text-foreground px-4 sm:px-0">Concluídos</h2>
            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 md:gap-6 pb-8 px-4 sm:px-0 -mx-4 sm:mx-0">
              {completedItems.map(item => {
                const anime = item.anime!
                return (
                  <Link key={item.id} href={`/anime/${anime.anilist_id}`} className="snap-start shrink-0 w-[130px] md:w-[180px] group flex flex-col gap-3">
                    <div className="w-full aspect-[2/3] relative rounded-md overflow-hidden bg-surface-2 opacity-80 group-hover:opacity-100 transition-opacity duration-220 ease-cinema">
                      {anime.cover_image && (
                        <Image src={anime.cover_image} alt="Capa" fill sizes="180px" className="object-cover transition-transform duration-220 ease-out group-hover:scale-[1.02]" />
                      )}
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded text-[10px] font-medium text-white shadow-sm border border-white/10">
                        <CircleCheck className="w-3 h-3 text-[#3DD68C]" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <h4 className="font-medium text-small leading-tight line-clamp-2 text-foreground group-hover:text-foreground/80 transition-opacity duration-150">
                        {anime.title_romaji || anime.title_english || anime.title_native}
                      </h4>
                      <span className="text-caption text-muted-foreground normal-case">
                        {item.score ? `★ ${item.score}` : `${anime.episodes || '?'} eps`}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
