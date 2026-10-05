import { getLibrary } from '@/actions/library'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LIBRARY_STATUS, STATUS_LABELS, LibraryStatus } from '@/lib/constants'
import { Navigation } from '@/components/Navigation'
import { CircleDashed, Bookmark, CirclePause, CircleCheck, CircleX } from 'lucide-react'
import { PosterCard } from '@/components/anime/PosterCard'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'

const getStatusIcon = (status: LibraryStatus) => {
  switch (status) {
    case LIBRARY_STATUS.WATCHING: return <CircleDashed className="w-3.5 h-3.5 text-foreground" />
    case LIBRARY_STATUS.PLANNED: return <Bookmark className="w-3.5 h-3.5 text-[#8A8FA3]" />
    case LIBRARY_STATUS.PAUSED: return <CirclePause className="w-3.5 h-3.5 text-[#F5B94A]" />
    case LIBRARY_STATUS.COMPLETED: return <CircleCheck className="w-3.5 h-3.5 text-[#3DD68C]" />
    case LIBRARY_STATUS.DROPPED: return <CircleX className="w-3.5 h-3.5 text-[#F0627A]" />
    default: return null
  }
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await getSession()
  if (!session) {
    redirect('/')
  }

  const { status: filterStatus } = await searchParams
  const { data: libraryItems, error } = await getLibrary()

  if (error || !libraryItems) {
    return (
      <>
        <Navigation />
        <main className="container mx-auto max-w-[1200px] pt-24 md:pt-32 pb-32 md:pb-16 px-4 sm:px-6 md:px-8 animate-in fade-in slide-in-from-bottom-2 duration-320 ease-cinema">
          <h1 className="text-h1 text-foreground mb-8">Biblioteca</h1>
          <EmptyState 
            title="Algo deu errado."
            description="Não foi possível carregar sua biblioteca no momento."
          />
        </main>
      </>
    )
  }

  // Filtragem
  const filteredItems = filterStatus
    ? libraryItems.filter(item => item.status === filterStatus)
    : libraryItems

  const tabs = [
    { label: 'Todos', value: '' },
    ...Object.values(LIBRARY_STATUS).map((val) => ({
      label: STATUS_LABELS[val],
      value: val,
    }))
  ]

  // Estatísticas editoriais
  const watchingCount = libraryItems.filter(item => item.status === LIBRARY_STATUS.WATCHING).length
  const completedCount = libraryItems.filter(item => item.status === LIBRARY_STATUS.COMPLETED).length
  const totalCount = libraryItems.length

  return (
    <>
      <Navigation />
      
      <main id="main-content" className="container mx-auto max-w-[1200px] min-h-screen pt-24 md:pt-32 pb-32 md:pb-16 px-4 sm:px-6 md:px-8 space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-320 ease-cinema">
        
        {/* CABEÇALHO */}
        <header className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-h1 text-foreground tracking-tight">Biblioteca</h1>
            <p className="text-body text-muted-foreground">
              {totalCount} na coleção &middot; {watchingCount} assistindo &middot; {completedCount} concluídos
            </p>
          </div>

          {/* FILTROS EDITORIAIS */}
          <div className="flex overflow-x-auto gap-6 snap-x scrollbar-hide pb-2 relative px-4 sm:px-0 -mx-4 sm:mx-0">
            {tabs.map(tab => {
              const isActive = (filterStatus || '') === tab.value
              return (
                <Link 
                  key={tab.label}
                  href={`/library${tab.value ? `?status=${tab.value}` : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  className={`snap-start whitespace-nowrap text-small transition-colors duration-150 relative pb-1 ${
                    isActive 
                      ? 'text-foreground font-medium' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-foreground rounded-full" />
                  )}
                </Link>
              )
            })}
          </div>
        </header>

        {/* GRADE DE POSTERS */}
        <section>
          {filteredItems.length === 0 ? (
            libraryItems.length === 0 ? (
              <EmptyState 
                title="Sua biblioteca está vazia."
                description="Explore alguns animes para começar sua coleção."
                action={
                  <Button asChild variant="secondary" className="rounded-full px-8">
                    <Link href="/search">Explorar anime</Link>
                  </Button>
                }
              />
            ) : (
              <EmptyState 
                title="Nenhum anime."
                description="Nenhum anime neste estado no momento."
              />
            )
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-12">
              {filteredItems.map((item) => {
                const anime = item.anime
                if (!anime) return null

                const progressPercent = anime.episodes ? Math.min((item.current_episode / anime.episodes) * 100, 100) : 0

                return (
                  <PosterCard 
                    key={item.id}
                    href={`/anime/${anime.anilist_id}`}
                    imageUrl={anime.cover_image}
                    title={anime.title_romaji || anime.title_english || anime.title_native}
                    subtitle={
                      item.status === LIBRARY_STATUS.WATCHING 
                        ? `Ep ${item.current_episode}${anime.episodes ? ` / ${anime.episodes}` : ''}`
                        : item.status === LIBRARY_STATUS.COMPLETED && item.score 
                          ? `★ ${item.score}` 
                          : STATUS_LABELS[item.status as LibraryStatus]
                    }
                    progressPercent={item.status === LIBRARY_STATUS.WATCHING && progressPercent > 0 ? progressPercent : undefined}
                    topBadgeIcon={!filterStatus ? getStatusIcon(item.status as LibraryStatus) : undefined}
                    dimmed={item.status === LIBRARY_STATUS.COMPLETED || item.status === LIBRARY_STATUS.DROPPED || item.status === LIBRARY_STATUS.PAUSED}
                  />
                )
              })}
            </div>
          )}
        </section>
      </main>
    </>
  )
}
