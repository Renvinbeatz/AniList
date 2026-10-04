import { getSession } from '@/lib/session'
import { supabaseServerClient } from '@/data/supabase'
import { redirect } from 'next/navigation'
import { logoutAction } from '@/actions/auth'
import { getLibrary } from '@/actions/library'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { LIBRARY_STATUS } from '@/lib/constants'
import { Library, Search, LogOut, Calendar, Clock } from 'lucide-react'

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
  
  // Estatísticas
  const totalItems = library.length
  const watchingCount = library.filter(item => item.status === LIBRARY_STATUS.WATCHING).length
  const plannedCount = library.filter(item => item.status === LIBRARY_STATUS.PLANNED).length
  const completedCount = library.filter(item => item.status === LIBRARY_STATUS.COMPLETED).length

  // Listas derivadas
  // A action getLibrary já traz ordenado por updated_at DESC, que é perfeito para "watching"
  const watchingItems = library.filter(item => item.status === LIBRARY_STATUS.WATCHING).slice(0, 4)
  
  // Para planned, ideal seria por created_at, mas updated_at DESC também é aceitável na Etapa 8.
  // Vamos reordenar manualmente apenas para garantir o requested "priorizar created_at mais recente"
  const plannedItems = library
    .filter(item => item.status === LIBRARY_STATUS.PLANNED)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6)

  // Para completed, priorizar completed_at
  const completedItems = library
    .filter(item => item.status === LIBRARY_STATUS.COMPLETED)
    .sort((a, b) => {
      const dateA = a.completed_at ? new Date(a.completed_at).getTime() : 0
      const dateB = b.completed_at ? new Date(b.completed_at).getTime() : 0
      return dateB - dateA
    })
    .slice(0, 6)

  return (
    <main className="container mx-auto max-w-[1200px] py-12 px-4 sm:px-6 md:px-8 space-y-16 pb-24">
      
      {/* HEADER & HERO RESUMO */}
      <div className="flex flex-col gap-6 md:gap-8">
        <div className="space-y-2">
          <h1 className="text-display text-foreground">
            Olá, {profile.display_name || profile.username}.
          </h1>
          <p className="text-muted-foreground text-h3 font-normal opacity-70">
            {watchingCount > 0 
              ? 'Continue de onde parou.' 
              : totalItems > 0 
                ? 'Sua biblioteca aguarda por você.' 
                : 'Bem-vindo ao seu novo espaço de animes.'}
          </p>
        </div>
        
        {/* NAVEGAÇÃO E STATS COMPACTO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border/50 pb-8">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
              <Link href="/search"><Search className="w-4 h-4 mr-2" /> Buscar</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
              <Link href="/today"><Clock className="w-4 h-4 mr-2" /> Hoje</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
              <Link href="/calendar"><Calendar className="w-4 h-4 mr-2" /> Calendário</Link>
            </Button>
            <Button variant="secondary" size="sm" asChild className="bg-surface-2 border border-border">
              <Link href="/library"><Library className="w-4 h-4 mr-2" /> Biblioteca</Link>
            </Button>
            <form action={logoutAction}>
              <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground hover:text-destructive transition-colors">
                <LogOut className="w-4 h-4 mr-2 md:mr-0" />
                <span className="md:hidden">Sair</span>
              </Button>
            </form>
          </div>

          {totalItems > 0 && (
            <div className="flex items-center gap-6 text-small text-muted-foreground font-mono">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-watching)]" />
                <span>{watchingCount} assistindo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-completed)]" />
                <span>{completedCount} concluídos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-foreground">{totalItems}</span>
                <span className="opacity-70">na biblioteca</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ESTADO COMPLETAMENTE VAZIO */}
      {totalItems === 0 && (
        <div className="bg-surface-1 border border-border rounded-xl p-12 text-center space-y-4 max-w-2xl mx-auto mt-12">
          <h2 className="text-h3 text-foreground">Sua biblioteca está vazia.</h2>
          <p className="text-body text-muted-foreground">
            Acompanhe seus primeiros animes para começar sua coleção.
          </p>
          <div className="pt-6">
            <Button asChild className="px-8 rounded-full">
              <Link href="/search">Buscar anime</Link>
            </Button>
          </div>
        </div>
      )}

      {/* CONTINUAR ASSISTINDO */}
      {totalItems > 0 && (
        <section className="space-y-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-h2 text-foreground">Continuar Assistindo</h2>
            {watchingCount > 4 && (
              <Link href={`/library?status=${LIBRARY_STATUS.WATCHING}`} className="text-small text-muted-foreground hover:text-primary transition-colors">
                Ver todos
              </Link>
            )}
          </div>
          
          {watchingItems.length === 0 ? (
            <div className="text-muted-foreground text-body italic opacity-70">
              Nenhum anime em progresso no momento.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {watchingItems.map(item => {
                const anime = item.anime
                if (!anime) return null
                const progressPercent = anime.episodes ? Math.min((item.current_episode / anime.episodes) * 100, 100) : 0
                return (
                  <Link key={item.id} href={`/anime/${anime.anilist_id}`} className="group block space-y-4">
                    {/* Poster Card Premium */}
                    <div className="aspect-[2/3] relative rounded-xl overflow-hidden bg-surface-2 border border-border group-hover:border-primary/30 transition-all duration-300">
                      {anime.cover_image ? (
                        <Image src={anime.cover_image} alt="Capa" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-small">Sem capa</div>
                      )}
                    </div>
                    
                    {/* Meta info below poster */}
                    <div className="space-y-2">
                      <h3 className="font-medium text-body leading-tight line-clamp-2 group-hover:text-primary transition-colors">{anime.title_romaji || anime.title_english || anime.title_native}</h3>
                      <div className="flex items-center justify-between text-caption text-muted-foreground font-mono">
                        <span>Ep {item.current_episode} {anime.episodes ? `/ ${anime.episodes}` : ''}</span>
                        {anime.episodes && <span>{Math.round(progressPercent)}%</span>}
                      </div>
                      
                      {/* Progress Bar Fina e Simples */}
                      {anime.episodes && anime.episodes > 0 && (
                        <div className="h-1 w-full bg-surface-3 rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${progressPercent}%` }} />
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* QUERO ASSISTIR & CONCLUÍDOS */}
      {totalItems > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 pt-8 border-t border-border/30">
          
          {/* QUERO ASSISTIR */}
          <section className="space-y-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-h3 text-foreground">Planejados</h2>
              {plannedCount > 6 && (
                <Link href={`/library?status=${LIBRARY_STATUS.PLANNED}`} className="text-small text-muted-foreground hover:text-foreground transition-colors">
                  Ver todos
                </Link>
              )}
            </div>
            
            <div className="space-y-4">
              {plannedItems.length === 0 ? (
                <p className="text-muted-foreground text-small italic opacity-70">Nenhum anime planejado.</p>
              ) : (
                plannedItems.map(item => {
                  const anime = item.anime
                  if (!anime) return null
                  return (
                    <Link key={item.id} href={`/anime/${anime.anilist_id}`} className="group flex items-center gap-4 p-3 -mx-3 rounded-lg hover:bg-surface-2 transition-colors duration-200 border border-transparent hover:border-border/50">
                      <div className="relative w-12 h-16 rounded overflow-hidden bg-surface-3 flex-shrink-0 border border-border/30">
                        {anime.cover_image && <Image src={anime.cover_image} alt="Capa" fill sizes="48px" className="object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-body truncate group-hover:text-primary transition-colors">{anime.title_romaji || anime.title_english || anime.title_native}</h4>
                        <div className="text-caption text-muted-foreground mt-1 flex gap-2">
                          <span className="capitalize">{anime.status?.toLowerCase().replace('_', ' ') || 'TBA'}</span>
                        </div>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </section>

          {/* CONCLUÍDOS */}
          <section className="space-y-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-h3 text-foreground">Concluídos Recentes</h2>
              {completedCount > 6 && (
                <Link href={`/library?status=${LIBRARY_STATUS.COMPLETED}`} className="text-small text-muted-foreground hover:text-foreground transition-colors">
                  Ver todos
                </Link>
              )}
            </div>
            
            <div className="space-y-4">
              {completedItems.length === 0 ? (
                <p className="text-muted-foreground text-small italic opacity-70">Nenhum anime concluído ainda.</p>
              ) : (
                completedItems.map(item => {
                  const anime = item.anime
                  if (!anime) return null
                  return (
                    <Link key={item.id} href={`/anime/${anime.anilist_id}`} className="group flex items-center gap-4 p-3 -mx-3 rounded-lg hover:bg-surface-2 transition-colors duration-200 border border-transparent hover:border-border/50">
                      <div className="relative w-12 h-16 rounded overflow-hidden bg-surface-3 flex-shrink-0 border border-border/30">
                        {anime.cover_image && <Image src={anime.cover_image} alt="Capa" fill sizes="48px" className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-body truncate group-hover:text-primary transition-colors">{anime.title_romaji || anime.title_english || anime.title_native}</h4>
                        <div className="text-caption text-muted-foreground mt-1 flex gap-2 items-center">
                          {item.score ? (
                            <span className="text-[var(--status-completed)] font-mono">★ {item.score}</span>
                          ) : (
                            <span>Sem nota</span>
                          )}
                          <span>•</span>
                          <span>{anime.episodes} eps</span>
                        </div>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
