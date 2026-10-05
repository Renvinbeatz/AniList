import { getLibrary } from '@/actions/library'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LIBRARY_STATUS, STATUS_LABELS, LibraryStatus } from '@/lib/constants'
import { Navigation } from '@/components/Navigation'
import { CircleDashed, Bookmark, CirclePause, CircleCheck, CircleX } from 'lucide-react'

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
        <main className="container mx-auto max-w-[1200px] pt-24 md:pt-32 pb-32 md:pb-16 px-4 sm:px-6 md:px-8">
          <h1 className="text-h1 text-foreground mb-4">Biblioteca</h1>
          <div className="text-destructive">Erro ao carregar a biblioteca.</div>
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

  return (
    <>
      <Navigation />
      
      <main className="container mx-auto max-w-[1200px] min-h-screen pt-24 md:pt-32 pb-32 md:pb-16 px-4 sm:px-6 md:px-8 space-y-12">
        
        {/* CABEÇALHO */}
        <header className="space-y-6">
          <h1 className="text-h1 text-foreground tracking-tight">Biblioteca</h1>

          {/* FILTROS EDITORIAIS */}
          <div className="flex overflow-x-auto gap-6 snap-x scrollbar-hide pb-2 relative">
            {tabs.map(tab => {
              const isActive = (filterStatus || '') === tab.value
              return (
                <Link 
                  key={tab.label}
                  href={`/library${tab.value ? `?status=${tab.value}` : ''}`}
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
            <div className="py-16 space-y-4 max-w-md">
              <h2 className="text-h3 text-foreground">Nada aqui ainda.</h2>
              <p className="text-body text-muted-foreground">
                Explore alguns animes para começar sua coleção.
              </p>
              <div className="pt-4">
                <Link href="/search" className="text-small font-medium text-foreground hover:text-foreground/80 transition-colors">
                  Explorar anime &rarr;
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-12">
              {filteredItems.map((item) => {
                const anime = item.anime
                if (!anime) return null

                const progressPercent = anime.episodes ? Math.min((item.current_episode / anime.episodes) * 100, 100) : 0

                return (
                  <Link 
                    key={item.id} 
                    href={`/anime/${anime.anilist_id}`}
                    className="group flex flex-col gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md"
                  >
                    <div className="relative aspect-[2/3] bg-surface-2 rounded-md overflow-hidden">
                      {anime.cover_image ? (
                        <Image
                          src={anime.cover_image}
                          alt={anime.title_romaji || 'Capa'}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                          className="object-cover transition-transform duration-220 ease-out sm:group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-small text-muted-foreground bg-surface-2">
                          Sem capa
                        </div>
                      )}
                      
                      {/* Overlay discreto no hover */}
                      <div className="absolute inset-0 bg-black/0 sm:group-hover:bg-black/10 transition-colors duration-220" />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <h3 className="font-medium text-small leading-tight line-clamp-2 text-foreground sm:group-hover:opacity-80 transition-opacity duration-150">
                        {anime.title_romaji || anime.title_english || anime.title_native}
                      </h3>
                      
                      {item.status === LIBRARY_STATUS.WATCHING ? (
                        <div className="space-y-2 pt-0.5">
                          <div className="text-caption text-muted-foreground normal-case">
                            Episódio {item.current_episode} {anime.episodes ? `de ${anime.episodes}` : ''}
                          </div>
                          {anime.episodes && anime.episodes > 0 ? (
                            <div className="h-1 w-full bg-border rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-accent" 
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-caption text-muted-foreground normal-case pt-0.5">
                          {!filterStatus && getStatusIcon(item.status as LibraryStatus)}
                          <span>
                            {item.status === LIBRARY_STATUS.COMPLETED && item.score 
                              ? `★ ${item.score}` 
                              : STATUS_LABELS[item.status as LibraryStatus]}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </>
  )
}
