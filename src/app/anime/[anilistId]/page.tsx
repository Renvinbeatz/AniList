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
import { PersonalPlatformControls } from '@/components/anime/PersonalPlatformControls'
import { StreamingPlatforms } from '@/components/anime/StreamingPlatforms'
import { AnimeReviews } from '@/components/social/AnimeReviews'
import { getStreamingLinks } from '@/data/streaming'
import { getPersonalPlatforms, getPersonalPlatformSelections } from '@/data/personal-platforms'
import type { PersonalPlatform } from '@/lib/platforms'
import { getValidAtmosphereColor, getGenreColor } from '@/lib/color'
import { Navigation } from '@/components/Navigation'
import { getFormatInfo } from '@/components/anime/FormatBadge'

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

  const { data: anime, error } = await ensureAnimeAction(id)

  if (error || !anime) {
    notFound()
  }

  const { data: userAnime } = await getUserAnimeRelation(anime.id)

  let nextAiring = await getNextAiring(anime.id)
  if (!nextAiring && (await refreshAiringIfStale(anime))) {
    nextAiring = await getNextAiring(anime.id)
  }

  const session = await getSession()
  let userPlatforms: import('@/data/platforms').UserAnimePlatform[] = []
  let availablePlatforms: import('@/data/platforms').Platform[] = []
  let personalPlatforms: PersonalPlatform[] = []
  let personalSelections: string[] = []
  const streaming = await getStreamingLinks(anime.anilist_id)
  
  if (userAnime && session?.profileId) {
    const { getAvailablePlatforms, getUserAnimePlatforms } = await import('@/data/platforms')
    availablePlatforms = await getAvailablePlatforms()
    userPlatforms = await getUserAnimePlatforms(session.profileId, anime.anilist_id)
    ;[personalPlatforms, personalSelections] = await Promise.all([
      getPersonalPlatforms(session.profileId), getPersonalPlatformSelections(session.profileId, userAnime.id),
    ])
  }

  const atmosphereColor = getValidAtmosphereColor(anime.cover_color)

  return (
    <>
      <Navigation />
      
      <main id="main-content" className="min-h-screen pb-32 lg:pb-16 relative selection:bg-accent/30 animate-in fade-in slide-in-from-bottom-2 duration-320 ease-cinema">
        
        {/* BASE BACKGROUND */}
        <div className="fixed inset-0 pointer-events-none z-[-2] bg-background" />

        {/* HERO BANNER */}
        <div className="relative w-full h-[40vh] md:h-[50vh] bg-surface-1 overflow-hidden z-[-1]">
          {anime.banner_image ? (
            <Image
              src={anime.banner_image}
              alt={`Banner de ${anime.title_romaji}`}
              fill
              sizes="100vw"
              className="object-cover opacity-60"
              priority
            />
          ) : anime.cover_image ? (
            <Image
              src={anime.cover_image}
              alt=""
              aria-hidden="true"
              fill
              sizes="100vw"
              className="object-cover opacity-20 blur-2xl scale-110"
              priority
            />
          ) : null}
          
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/60 to-background" />
        </div>

        <div className="container mx-auto max-w-[1200px] px-4 sm:px-6 md:px-8 relative z-10">
          <div className="flex flex-col md:flex-row gap-8 md:gap-16 -mt-32 md:-mt-48">
            
            {/* COVER IMAGE COLUMN */}
            <div className="flex-shrink-0 mx-auto md:mx-0 w-[180px] sm:w-[220px] md:w-[280px] space-y-6 relative z-10">
              
              {/* ATMOSPHERIC HALO SUTIL */}
              <div 
                className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[450px] h-[300px] md:h-[450px] rounded-full blur-[80px] md:blur-[120px] opacity-[0.10] md:opacity-[0.06] pointer-events-none z-[-1]"
                style={{ backgroundColor: atmosphereColor }}
              />

              <div className="aspect-[2/3] relative rounded-md overflow-hidden bg-surface-2">
                {anime.cover_image ? (
                  <Image
                    src={anime.cover_image}
                    alt={anime.title_romaji || 'Capa do anime'}
                    fill
                    sizes="(max-width: 768px) 220px, 280px"
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
              <div className="hidden md:flex flex-col gap-4 text-small text-muted-foreground pt-4">
                <div className="flex items-baseline justify-between border-b border-border/50 pb-2">
                  <span className="text-caption text-text-3">Formato</span>
                  <span className="font-medium text-foreground capitalize">
                    {getFormatInfo(anime.format)?.label || 'TBA'}
                    {anime.episodes ? ` (${anime.episodes} eps)` : ''}
                  </span>
                </div>
                <div className="flex items-baseline justify-between border-b border-border/50 pb-2">
                  <span className="text-caption text-text-3">Duração</span>
                  <span className="font-medium text-foreground">{anime.duration ? `${anime.duration}m` : 'N/A'}</span>
                </div>
                <div className="flex items-baseline justify-between border-b border-border/50 pb-2">
                  <span className="text-caption text-text-3">Status</span>
                  <span className="font-medium text-foreground capitalize">{anime.status?.toLowerCase().replace('_', ' ') || 'Desconhecido'}</span>
                </div>
                <div className="flex items-baseline justify-between border-b border-border/50 pb-2">
                  <span className="text-caption text-text-3">Temporada</span>
                  <span className="font-medium text-foreground capitalize">
                    {anime.season ? anime.season.toLowerCase() : ''} {anime.season_year || ''}
                  </span>
                </div>
              </div>
            </div>

            {/* MAIN INFO COLUMN */}
            <div className="flex-1 space-y-12 pt-2 md:pt-20">
              
              {/* TÍTULOS E METADADOS */}
              <div className="space-y-6 text-center md:text-left">
                <div className="space-y-2">
                  <h1 className="text-h1 font-semibold tracking-tight text-foreground leading-tight md:leading-tight">
                    {anime.title_romaji || anime.title_english || anime.title_native}
                  </h1>
                  
                  {(anime.title_english && anime.title_english !== anime.title_romaji) || anime.title_native ? (
                    <h2 className="text-h3 font-normal text-muted-foreground">
                      {anime.title_english && anime.title_english !== anime.title_romaji ? anime.title_english : anime.title_native}
                    </h2>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3 text-body text-muted-foreground pt-2">
                  {anime.season_year && (
                    <span>{anime.season_year}</span>
                  )}
                  {anime.season_year && anime.average_score && <span>&middot;</span>}
                  
                  {anime.average_score && (
                    <span className="font-medium text-foreground">★ {anime.average_score}%</span>
                  )}

                  {anime.genres && anime.genres.length > 0 && <span className="hidden md:inline-block">&middot;</span>}
                  
                  {/* GÊNEROS INLINE */}
                  {anime.genres && anime.genres.length > 0 && (
                    <div className="hidden md:flex flex-wrap gap-x-2 gap-y-2">
                      {anime.genres.slice(0, 3).map((genre) => (
                        <span 
                          key={genre} 
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${getGenreColor(genre)}`}
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* BLOCO DE AÇÕES E BIBLIOTECA */}
              <div className="flex flex-col gap-8">
                <div className="flex flex-col sm:flex-row items-center sm:items-stretch justify-center md:justify-start gap-4">
                  <LibraryControls animeId={anime.id} initialUserAnime={userAnime} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                  {/* PRÓXIMO EPISÓDIO */}
                  {nextAiring && (
                    <div>
                      <NextEpisode episode={nextAiring.episode} airingAt={nextAiring.airing_at} />
                    </div>
                  )}

                  {/* PROGRESSO */}
                  {userAnime && (
                    <div>
                      <EpisodeProgress 
                        userAnimeId={userAnime.id}
                        currentEpisode={userAnime.current_episode}
                        totalEpisodes={anime.episodes}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* DESCRIÇÃO */}
              {anime.description && (
                <div className="space-y-4 max-w-[70ch]">
                  <p className="text-body text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {anime.description.replace(/<br><br>/g, '\n').replace(/<br>/g, '\n').replace(/<[^>]*>?/gm, '')}
                  </p>
                </div>
              )}

              {/* GÊNEROS MOBILE */}
              {anime.genres && anime.genres.length > 0 && (
                <div className="flex md:hidden flex-wrap gap-2 justify-center pt-4">
                  {anime.genres.slice(0, 3).map((genre) => {
                    const Icon = genreIcons[genre] || Tag
                    return (
                      <div 
                        key={genre}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-caption border ${getGenreColor(genre)}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{genre}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* PLATAFORMAS */}
              <StreamingPlatforms result={streaming} />
              {userAnime && session?.profileId && (
                <div className="pt-8">
                  <PlatformControls 
                    anilistId={anime.anilist_id} 
                    userPlatforms={userPlatforms} 
                    availablePlatforms={availablePlatforms} 
                  />
                  <PersonalPlatformControls anilistId={anime.anilist_id} platforms={personalPlatforms} selectedIds={personalSelections} />
                </div>
              )}

              <AnimeReviews animeId={anime.id} anilistId={anime.anilist_id} />
              {/* INFORMAÇÕES SECUNDÁRIAS MOBILE */}
              <div className="md:hidden grid grid-cols-2 gap-6 mt-12 text-small border-t border-border/50 pt-8">
                <div className="space-y-1 text-center">
                  <span className="text-caption text-text-3 block">Formato</span>
                  <span className="font-medium text-foreground">
                    {getFormatInfo(anime.format)?.label || 'TBA'}
                    {anime.episodes ? ` (${anime.episodes} eps)` : ''}
                  </span>
                </div>
                <div className="space-y-1 text-center">
                  <span className="text-caption text-text-3 block">Status</span>
                  <span className="font-medium text-foreground capitalize">{anime.status?.toLowerCase().replace('_', ' ') || 'Desconhecido'}</span>
                </div>
                <div className="space-y-1 text-center">
                  <span className="text-caption text-text-3 block">Temporada</span>
                  <span className="font-medium text-foreground capitalize">
                    {anime.season ? anime.season.toLowerCase() : ''} {anime.season_year || ''}
                  </span>
                </div>
                <div className="space-y-1 text-center">
                  <span className="text-caption text-text-3 block">Duração</span>
                  <span className="font-medium text-foreground">{anime.duration ? `${anime.duration}m` : 'N/A'}</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </>
  )
}
