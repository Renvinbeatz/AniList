import { ensureAnimeAction } from '@/actions/anime'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import {
  Heart,
  Swords,
  Sparkles,
  Smile,
  GraduationCap,
  Theater,
  Ghost,
  Search,
  Atom,
  Trophy,
  Tag
} from 'lucide-react'
import { getUserAnimeRelation } from '@/actions/library'
import { LibraryControls } from '@/components/anime/LibraryControls'
import { EpisodeProgress } from '@/components/anime/EpisodeProgress'
import { NextEpisode } from '@/components/anime/NextEpisode'
import { getNextAiring } from '@/data/airing'
import { refreshAiringIfStale } from '@/services/airing'
import { getSession } from '@/lib/session'
import { PlatformControls } from '@/components/anime/PlatformControls'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getValidAtmosphereColor } from '@/lib/color'

// Mapeamento simples de ícones para gêneros
const genreIcons: Record<string, React.ElementType> = {
  Romance: Heart,
  Action: Swords,
  Fantasy: Sparkles,
  Comedy: Smile,
  School: GraduationCap,
  Drama: Theater,
  Horror: Ghost,
  Mystery: Search,
  'Sci-Fi': Atom,
  Sports: Trophy,
}

// Configuração para extrair params em Next.js 15
export default async function AnimePage({
  params,
}: {
  params: Promise<{ anilistId: string }>
}) {
  const { anilistId } = await params
  const id = Number(anilistId)
  
  if (isNaN(id)) {
    notFound()
  }

  // Utiliza a action existente que checa DB -> AniList -> DB
  const { data: anime, error } = await ensureAnimeAction(id)

  if (error || !anime) {
    // Para simplificar a UX, apenas enviamos para 404 se não for possível recuperar
    // Se fosse um painel administrativo, poderíamos mostrar o erro na tela.
    notFound()
  }

  const { data: userAnime } = await getUserAnimeRelation(anime.id)

  // Fonte local: Supabase. A AniList só é consultada pelo sync controlado (TTL/status),
  // nunca a cada visita, e uma falha nele não afeta a página.
  let nextAiring = await getNextAiring(anime.id)
  if (!nextAiring && (await refreshAiringIfStale(anime))) {
    nextAiring = await getNextAiring(anime.id)
  }

  // Plataformas (somente se o anime estiver na biblioteca e a sessão existir)
  const session = await getSession()
  let userPlatforms: import('@/data/platforms').UserAnimePlatform[] = []
  let availablePlatforms: import('@/data/platforms').Platform[] = []
  
  if (userAnime && session?.profileId) {
    const { getAvailablePlatforms, getUserAnimePlatforms } = await import('@/data/platforms')
    availablePlatforms = await getAvailablePlatforms()
    userPlatforms = await getUserAnimePlatforms(session.profileId, anime.anilist_id)
  }

  const atmosphereColor = getValidAtmosphereColor(anime.cover_color)

  return (
    <main className="min-h-screen pb-24 relative">
      
      {/* BASE BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-bg" />

      {/* HEADER NAVEGAÇÃO PONTUAL */}
      <nav className="absolute top-8 left-4 sm:left-8 z-50">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 text-caption font-medium uppercase tracking-widest text-text-2 hover:text-text-1 transition-colors bg-surface-1/50 backdrop-blur-md px-4 py-2 rounded-full border border-border"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
      </nav>

      {/* HERO BANNER */}
      <div className="relative w-full h-[30vh] md:h-[45vh] bg-surface-1 overflow-hidden z-10">
        {anime.banner_image ? (
          <Image
            src={anime.banner_image}
            alt={`Banner de ${anime.title_romaji}`}
            fill
            sizes="100vw"
            className="object-cover opacity-50"
            priority
          />
        ) : anime.cover_image ? (
          // Fallback usando a cover expandida e borrada
          <Image
            src={anime.cover_image}
            alt="Fallback banner"
            fill
            sizes="100vw"
            className="object-cover opacity-20 blur-2xl scale-110"
            priority
          />
        ) : null}
        
        {/* Gradient Overlay Cinematográfico */}
        <div className="absolute inset-0 bg-gradient-to-b from-bg/20 via-bg/60 to-bg" />
      </div>

      <div className="container mx-auto max-w-[1200px] px-4 sm:px-6 md:px-8 relative z-20">
        <div className="flex flex-col md:flex-row gap-8 md:gap-16 -mt-24 md:-mt-32">
          
          {/* COVER IMAGE COLUMN */}
          <div className="flex-shrink-0 mx-auto md:mx-0 w-[200px] md:w-[260px] space-y-6 relative">
            
            {/* ATMOSPHERIC HALO BEHIND ARTWORK (Etapa 14.5) */}
            <div 
              className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[450px] h-[300px] md:h-[450px] rounded-full blur-[80px] md:blur-[100px] opacity-[0.15] md:opacity-[0.08] pointer-events-none z-0"
              style={{ backgroundColor: atmosphereColor }}
            />

            <div className="aspect-[2/3] relative rounded-2xl overflow-hidden shadow-2xl border border-border-strong bg-surface-2 group z-10">
              {anime.cover_image ? (
                <Image
                  src={anime.cover_image}
                  alt={anime.title_romaji || 'Capa do anime'}
                  fill
                  sizes="(max-width: 768px) 200px, 260px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-small">
                  Sem capa
                </div>
              )}
            </div>
            
            {/* INFORMAÇÕES SECUNDÁRIAS (Desktop) */}
            <div className="hidden md:flex flex-col gap-4 text-small text-muted-foreground">
              <div className="space-y-1">
                <span className="text-caption uppercase tracking-widest opacity-60">Formato</span>
                <p className="font-medium text-foreground capitalize">{anime.episodes ? `${anime.episodes} episódios` : 'TBA'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-caption uppercase tracking-widest opacity-60">Duração</span>
                <p className="font-medium text-foreground">{anime.duration ? `${anime.duration} min` : 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-caption uppercase tracking-widest opacity-60">Status</span>
                <p className="font-medium text-foreground capitalize">{anime.status?.toLowerCase().replace('_', ' ') || 'Desconhecido'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-caption uppercase tracking-widest opacity-60">Temporada</span>
                <p className="font-medium text-foreground capitalize">
                  {anime.season ? anime.season.toLowerCase() : ''} {anime.season_year || ''}
                </p>
              </div>
            </div>
          </div>

          {/* MAIN INFO COLUMN */}
          <div className="flex-1 space-y-10 pt-2 md:pt-14">
            
            {/* TÍTULOS E SCORE */}
            <div className="space-y-6 text-center md:text-left">
              <div className="space-y-2">
                <h1 className="text-h1 md:text-display font-semibold tracking-tight text-foreground leading-tight">
                  {anime.title_romaji || anime.title_english || anime.title_native}
                </h1>
                
                {(anime.title_english && anime.title_english !== anime.title_romaji) || anime.title_native ? (
                  <h2 className="text-h3 font-normal text-muted-foreground opacity-70">
                    {anime.title_english && anime.title_english !== anime.title_romaji ? anime.title_english : anime.title_native}
                  </h2>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                {anime.average_score && (
                  <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-small font-semibold border border-primary/20">
                    <span>★</span>
                    <span>{anime.average_score}%</span>
                  </div>
                )}
                
                <div className="w-px h-6 bg-border mx-2 hidden sm:block" />
                
                <LibraryControls animeId={anime.id} initialUserAnime={userAnime} />
              </div>

              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 pt-4">
                {/* PRÓXIMO EPISÓDIO */}
                {nextAiring && (
                  <div className="flex-1 min-w-[280px]">
                    <NextEpisode episode={nextAiring.episode} airingAt={nextAiring.airing_at} />
                  </div>
                )}

                {/* PROGRESSO DE EPISÓDIOS */}
                {userAnime && (
                  <div className="flex-1 min-w-[280px]">
                    <EpisodeProgress 
                      userAnimeId={userAnime.id}
                      currentEpisode={userAnime.current_episode}
                      totalEpisodes={anime.episodes}
                    />
                  </div>
                )}
              </div>

              {/* PLATAFORMAS (somente se estiver na biblioteca) */}
              {userAnime && session?.profileId && (
                <div className="pt-2">
                  <PlatformControls 
                    anilistId={anime.anilist_id} 
                    userPlatforms={userPlatforms} 
                    availablePlatforms={availablePlatforms} 
                  />
                </div>
              )}
            </div>

            {/* GÊNEROS */}
            {anime.genres && anime.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {anime.genres.map((genre) => {
                  const Icon = genreIcons[genre] || Tag
                  return (
                    <div 
                      key={genre}
                      className="flex items-center gap-1.5 px-3 py-1 bg-surface-2 text-muted-foreground hover:text-foreground transition-colors rounded-full text-caption border border-border"
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{genre}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* DESCRIÇÃO */}
            {anime.description && (
              <div className="space-y-4 max-w-3xl">
                <h3 className="text-small uppercase tracking-widest text-muted-foreground font-semibold">Sinopse</h3>
                <p className="text-body text-text-2 leading-relaxed whitespace-pre-wrap">
                  {anime.description.replace(/<br><br>/g, '\n').replace(/<br>/g, '\n').replace(/<[^>]*>?/gm, '')}
                </p>
              </div>
            )}

            {/* INFORMAÇÕES SECUNDÁRIAS MOBILE */}
            <div className="md:hidden grid grid-cols-2 gap-6 mt-8 text-small border-t border-border/50 pt-8">
              <div className="space-y-1">
                <span className="text-caption uppercase tracking-widest text-muted-foreground block">Formato</span>
                <span className="font-medium text-foreground">{anime.episodes ? `${anime.episodes} eps` : 'TBA'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-caption uppercase tracking-widest text-muted-foreground block">Status</span>
                <span className="font-medium text-foreground capitalize">{anime.status?.toLowerCase().replace('_', ' ') || 'Desconhecido'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-caption uppercase tracking-widest text-muted-foreground block">Temporada</span>
                <span className="font-medium text-foreground capitalize">
                  {anime.season ? anime.season.toLowerCase() : ''} {anime.season_year || ''}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-caption uppercase tracking-widest text-muted-foreground block">Duração</span>
                <span className="font-medium text-foreground">{anime.duration ? `${anime.duration} min` : 'N/A'}</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  )
}
