'use client'

import { useState } from 'react'
import { searchAnimeAction } from '@/actions/anime'
import { NormalizedAnimeInsert } from '@/lib/anilist/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Search } from 'lucide-react'
import { Navigation } from '@/components/Navigation'
import { PosterCard } from '@/components/anime/PosterCard'
import { EmptyState } from '@/components/ui/empty-state'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<NormalizedAnimeInsert[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    setIsSearching(true)
    setSearchError(null)
    setHasSearched(true)

    const res = await searchAnimeAction(query)
    
    setIsSearching(false)
    if (res.error) {
      setSearchError(res.error)
      setResults([])
    } else if (res.results) {
      setResults(res.results)
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
          <form onSubmit={handleSearch} className="relative flex items-center w-full max-w-2xl">
            <Search className="absolute left-5 w-5 h-5 text-muted-foreground" />
            <Input 
              aria-label="Buscar anime"
              placeholder="Digite o nome de um anime..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isSearching}
              className="w-full h-14 pl-14 pr-28 text-body bg-surface-2 border-transparent rounded-full focus-visible:ring-1 focus-visible:ring-accent focus-visible:bg-surface-3 transition-colors duration-150 placeholder:text-text-3"
            />
            <Button 
              type="submit" 
              disabled={isSearching || !query.trim()}
              className="absolute right-1.5 h-11 rounded-full px-6 bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
            </Button>
          </form>
        </header>

        {searchError && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-md text-small border border-destructive/20 max-w-2xl">
            {searchError}
          </div>
        )}

        {/* RESULTS GRID */}
        <section>
          {!hasSearched && !isSearching && results.length === 0 && !searchError && (
            <div className="py-24 text-center">
              <p className="text-body text-muted-foreground">Pesquise um anime para começar.</p>
            </div>
          )}

          {hasSearched && !isSearching && results.length === 0 && !searchError && (
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
