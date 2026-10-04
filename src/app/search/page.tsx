'use client'

import { useState } from 'react'
import { searchAnimeAction } from '@/actions/anime'
import { NormalizedAnimeInsert } from '@/lib/anilist/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Search, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<NormalizedAnimeInsert[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    setIsSearching(true)
    setSearchError(null)

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
    <main className="container mx-auto max-w-[1200px] min-h-screen py-12 px-4 sm:px-6 md:px-8 space-y-12 pb-24">
      {/* HEADER NAVEGAÇÃO PONTUAL */}
      <nav>
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground -ml-4">
          <Link href="/dashboard"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Dashboard</Link>
        </Button>
      </nav>

      {/* EXPLORE HEADER */}
      <div className="space-y-6 max-w-2xl mx-auto text-center mt-8">
        <h1 className="text-display text-foreground tracking-tight">Explorar</h1>
        <form onSubmit={handleSearch} className="relative flex items-center w-full mt-8 shadow-2xl">
          <Search className="absolute left-6 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Digite o nome de um anime..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isSearching}
            className="w-full h-16 pl-16 pr-32 text-body bg-surface-1 border-border-strong rounded-2xl focus-visible:ring-primary focus-visible:border-primary transition-all placeholder:text-text-3"
          />
          <Button 
            type="submit" 
            disabled={isSearching || !query.trim()}
            className="absolute right-2 h-12 rounded-xl px-6 bg-surface-3 hover:bg-surface-3/80 text-foreground"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
          </Button>
        </form>
      </div>

      {searchError && (
        <div className="max-w-2xl mx-auto p-4 bg-destructive/10 text-destructive rounded-lg text-small text-center border border-destructive/20">
          {searchError}
        </div>
      )}

      {/* RESULTS GRID */}
      <div className="space-y-6 pt-8">
        {results.length === 0 && !isSearching && !searchError && query.length > 0 && (
          <p className="text-center text-muted-foreground text-body py-20 italic opacity-70">
            Nenhum resultado encontrado.
          </p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {results.map((anime) => (
            <Link 
              key={anime.anilist_id} 
              href={`/anime/${anime.anilist_id}`}
              className="group flex flex-col space-y-3"
            >
              <div className="aspect-[2/3] relative rounded-xl overflow-hidden bg-surface-2 border border-border group-hover:border-primary/40 transition-all duration-300">
                {anime.cover_image ? (
                  <Image 
                    src={anime.cover_image} 
                    alt={anime.title_romaji || 'Capa'} 
                    fill 
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-caption bg-surface-3">
                    Sem capa
                  </div>
                )}
                
                {/* Score badge if available */}
                {anime.average_score && (
                  <div className="absolute top-2 right-2 bg-surface-1/90 backdrop-blur border border-border/50 text-foreground text-[10px] font-mono px-1.5 py-0.5 rounded shadow-lg">
                    ★ {Math.round(anime.average_score / 10)}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-1">
                <h3 className="font-medium text-small leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {anime.title_romaji || anime.title_english || anime.title_native}
                </h3>
                <div className="text-caption text-muted-foreground flex items-center gap-2">
                  <span>{anime.season_year || 'TBA'}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
