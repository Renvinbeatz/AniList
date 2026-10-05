import { searchAnimeAction } from '@/actions/anime'
import { Navigation } from '@/components/Navigation'
import { EmptyState } from '@/components/ui/empty-state'
import { FormatBadge } from '@/components/anime/FormatBadge'
import { PosterCard } from '@/components/anime/PosterCard'
import { SearchInput } from '@/components/SearchInput'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q: query } = await searchParams
  
  let results: import('@/lib/anilist/types').NormalizedAnimeInsert[] = []
  let searchError: string | null = null
  const hasSearched = !!query

  if (query) {
    const res = await searchAnimeAction(query)
    if (res.error) {
      searchError = res.error
    } else if (res.results) {
      results = res.results
    }
  }

  return (
    <>
      <Navigation />
      <main id="main-content" className="container mx-auto max-w-[1200px] min-h-screen pt-24 md:pt-32 pb-32 md:pb-16 px-4 sm:px-6 md:px-8 space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-320 ease-cinema">
        {/* EXPLORE HEADER & SEARCH */}
        <header className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-h1 text-foreground tracking-tight">Explorar</h1>
          </div>
          <SearchInput />
        </header>

        {searchError && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-md text-small border border-destructive/20 max-w-2xl">
            {searchError}
          </div>
        )}

        {/* RESULTS GRID */}
        <section>
          {!hasSearched && !searchError && (
            <div className="py-24 text-center">
              <p className="text-body text-muted-foreground">Pesquise um anime para começar.</p>
            </div>
          )}

          {hasSearched && results.length === 0 && !searchError && (
            <EmptyState 
              title="Nenhuma obra encontrada."
              description={`Não conseguimos encontrar resultados para "${query}".`}
            />
          )}

          {results.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-12">
              {results.map((anime) => {
                // Metadata formatting
                const parts = []
                if (anime.season_year) parts.push(anime.season_year)
                if (anime.average_score) parts.push(`★ ${anime.average_score}%`)
                const subtitle = parts.join(' · ') || 'Desconhecido'

                return (
                  <PosterCard 
                    key={anime.anilist_id}
                    href={`/anime/${anime.anilist_id}`}
                    imageUrl={anime.cover_image}
                    title={anime.title_romaji || anime.title_english || anime.title_native}
                    subtitle={subtitle}
                  >
                    <div className="absolute top-2 right-2">
                      <FormatBadge format={anime.format} />
                    </div>
                  </PosterCard>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </>
  )
}
