'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Search } from 'lucide-react'

export function SearchInput() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  
  const [query, setQuery] = useState(initialQuery)
  const [isPending, startTransition] = useTransition()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    })
  }

  return (
    <form onSubmit={handleSearch} className="relative flex items-center w-full max-w-2xl">
      <Search className="absolute left-5 w-5 h-5 text-muted-foreground" />
      <Input 
        name="q"
        aria-label="Buscar anime"
        placeholder="Digite o nome de um anime..." 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={isPending}
        className="w-full h-14 pl-14 pr-28 text-body bg-surface-2 border-transparent rounded-full focus-visible:ring-1 focus-visible:ring-accent focus-visible:bg-surface-3 transition-colors duration-150 placeholder:text-text-3"
      />
      <Button 
        type="submit" 
        disabled={isPending || !query.trim()}
        className="absolute right-1.5 h-11 rounded-full px-6 bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
      </Button>
    </form>
  )
}
