import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { supabaseServerClient } from '@/data/supabase'
import { getLibrary } from '@/actions/library'
import { Navigation } from '@/components/Navigation'
import { LIBRARY_STATUS } from '@/lib/constants'
import Image from 'next/image'
import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { logoutAction } from '@/actions/auth'

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
  const { data: library } = await getLibrary()
  const libraryItems = library || []

  // Calculate statistics
  const totalAnime = libraryItems.length
  const watchingCount = libraryItems.filter(item => item.status === LIBRARY_STATUS.WATCHING).length
  const completedCount = libraryItems.filter(item => item.status === LIBRARY_STATUS.COMPLETED).length

  // Get recent 4-6 items for preview
  const recentItems = libraryItems.slice(0, 6)

  // Identity
  const displayName = profile.display_name || profile.username
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <>
      <Navigation />

      <main className="min-h-screen pb-32 md:pb-16 pt-24 md:pt-32 relative selection:bg-accent/30">
        <div className="absolute inset-0 pointer-events-none z-[-2] bg-background" />

        {/* ATMOSFERA MUITO DISCRETA NO TOPO */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full blur-[120px] opacity-[0.03] pointer-events-none z-[-1]"
          style={{ backgroundColor: 'var(--accent)' }}
        />

        <div className="container mx-auto max-w-[800px] px-4 sm:px-6 md:px-8 space-y-16">
          
          {/* HERO / IDENTIDADE */}
          <section className="flex flex-col items-center text-center space-y-6">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-surface-2 border border-border flex items-center justify-center shadow-lg">
              <span className="text-display font-medium text-muted-foreground">{initial}</span>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-display font-semibold tracking-tight text-foreground">
                {displayName}
              </h1>
              {profile.display_name && (
                <h2 className="text-body text-muted-foreground">@{profile.username}</h2>
              )}
            </div>

            {/* ESTATÍSTICAS EDITORIAIS */}
            <div className="pt-2 text-body text-muted-foreground">
              {totalAnime > 0 ? (
                <span>
                  {totalAnime} na coleção 
                  <span className="mx-2 opacity-50">&bull;</span> 
                  {watchingCount} assistindo 
                  <span className="mx-2 opacity-50">&bull;</span> 
                  {completedCount} concluídos
                </span>
              ) : (
                <span>Nenhum anime na coleção</span>
              )}
            </div>
          </section>

          {/* PRÉVIA DA COLEÇÃO */}
          {recentItems.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <h2 className="text-h3 font-semibold text-foreground">Atividade Recente</h2>
                <Link href="/library" className="text-small text-muted-foreground hover:text-foreground transition-colors">
                  Ver tudo
                </Link>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
                {recentItems.map((item) => {
                  const anime = item.anime
                  if (!anime) return null

                  return (
                    <Link 
                      key={item.id} 
                      href={`/anime/${anime.anilist_id}`}
                      className="group flex flex-col gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md"
                    >
                      <div className="relative aspect-[2/3] bg-surface-2 rounded-md overflow-hidden ring-1 ring-white/5">
                        {anime.cover_image ? (
                          <Image
                            src={anime.cover_image}
                            alt={anime.title_romaji || 'Capa do anime'}
                            fill
                            sizes="(max-width: 768px) 33vw, 16vw"
                            className="object-cover transition-transform duration-220 ease-out sm:group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                            Sem capa
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 sm:group-hover:bg-black/10 transition-colors duration-220" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* CONFIGURAÇÕES E AÇÕES */}
          <section className="space-y-6">
            <h2 className="text-h3 font-semibold text-foreground border-b border-border/50 pb-4">Conta</h2>
            
            <div className="flex flex-col gap-2">
              <form action={logoutAction}>
                <button 
                  type="submit"
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-surface-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive border border-border/50 hover:border-destructive/30 transition-colors text-small font-medium"
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
