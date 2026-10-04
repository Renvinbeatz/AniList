import { getLibrary } from '@/actions/library'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LIBRARY_STATUS, STATUS_LABELS, LibraryStatus } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

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
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-h2 text-foreground mb-4">Minha Biblioteca</h1>
        <div className="text-destructive">Erro ao carregar a biblioteca.</div>
      </div>
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
    <main className="container mx-auto max-w-[1200px] min-h-screen py-12 px-4 sm:px-6 md:px-8 space-y-12 pb-24">
      {/* HEADER NAVEGAÇÃO PONTUAL */}
      <nav className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground -ml-4">
          <Link href="/dashboard"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Link>
        </Button>
        <Button variant="secondary" size="sm" asChild className="bg-surface-2 border border-border">
          <Link href="/search">Buscar Anime</Link>
        </Button>
      </nav>

      {/* TÍTULO E FILTROS */}
      <div className="space-y-8">
        <div>
          <h1 className="text-display text-foreground tracking-tight">Biblioteca</h1>
          <p className="text-h3 text-muted-foreground font-normal opacity-70">
            Sua coleção pessoal
          </p>
        </div>

        {/* Tabs / Filtros Discretos */}
        <div className="flex overflow-x-auto pb-2 gap-6 snap-x scrollbar-hide border-b border-border/50">
          {tabs.map(tab => {
            const isActive = (filterStatus || '') === tab.value
            return (
              <Link 
                key={tab.label}
                href={`/library${tab.value ? `?status=${tab.value}` : ''}`}
                className={`snap-start whitespace-nowrap pb-4 text-small transition-all relative ${
                  isActive 
                    ? 'text-foreground font-medium' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Grid de Animes */}
      <div className="pt-2">
        {filteredItems.length === 0 ? (
          <div className="text-center py-24 space-y-4 max-w-md mx-auto">
            <h2 className="text-h3 text-foreground">Nada por aqui.</h2>
            <p className="text-body text-muted-foreground">Nenhum anime encontrado nesta categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredItems.map((item) => {
              const anime = item.anime
              if (!anime) return null

              const progressPercent = anime.episodes ? Math.min((item.current_episode / anime.episodes) * 100, 100) : 0

              // Determine status color for badge
              let statusColor = 'var(--text-3)'
              switch(item.status) {
                case LIBRARY_STATUS.WATCHING: statusColor = 'var(--status-watching)'; break;
                case LIBRARY_STATUS.COMPLETED: statusColor = 'var(--status-completed)'; break;
                case LIBRARY_STATUS.PAUSED: statusColor = 'var(--status-paused)'; break;
                case LIBRARY_STATUS.DROPPED: statusColor = 'var(--status-dropped)'; break;
                case LIBRARY_STATUS.PLANNED: statusColor = 'var(--status-planned)'; break;
              }

              return (
                <Link 
                  key={item.id} 
                  href={`/anime/${anime.anilist_id}`}
                  className="group flex flex-col gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
                >
                  <div className="relative aspect-[2/3] bg-surface-2 border border-border rounded-xl overflow-hidden group-hover:border-primary/40 transition-all duration-300">
                    {anime.cover_image ? (
                      <Image
                        src={anime.cover_image}
                        alt={anime.title_romaji || 'Capa'}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-caption text-muted-foreground bg-surface-3">
                        Sem capa
                      </div>
                    )}

                    {/* Badge de status (Apenas na view 'Todos') */}
                    {!filterStatus && (
                      <div className="absolute top-2 left-2 bg-surface-1/90 backdrop-blur border border-border/50 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded flex items-center gap-1.5 shadow-lg">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
                        <span className="text-foreground">{STATUS_LABELS[item.status as LibraryStatus]}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <h3 className="font-medium text-small leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {anime.title_romaji || anime.title_english || anime.title_native}
                    </h3>
                    
                    <div className="flex justify-between items-center text-caption text-muted-foreground font-mono">
                      <span>Ep {item.current_episode} {anime.episodes ? `/ ${anime.episodes}` : ''}</span>
                      {anime.episodes && <span>{Math.round(progressPercent)}%</span>}
                    </div>

                    {/* Barra de Progresso Fina */}
                    {(item.status === LIBRARY_STATUS.WATCHING || item.status === LIBRARY_STATUS.COMPLETED || item.current_episode > 0) && anime.episodes && anime.episodes > 0 ? (
                      <div className="h-1 w-full bg-surface-3 rounded-full overflow-hidden">
                        <div 
                          className="h-full" 
                          style={{ 
                            width: `${progressPercent}%`,
                            backgroundColor: item.status === LIBRARY_STATUS.COMPLETED ? 'var(--status-completed)' : 'var(--primary)' 
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
