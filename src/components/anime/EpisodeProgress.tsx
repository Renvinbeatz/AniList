'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, Minus, Plus } from 'lucide-react'
import { updateAnimeProgress } from '@/actions/library'

interface EpisodeProgressProps {
  userAnimeId: string
  currentEpisode: number
  totalEpisodes: number | null
}

export function EpisodeProgress({
  userAnimeId,
  currentEpisode: initialEpisode,
  totalEpisodes,
}: EpisodeProgressProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode)
  const [prevInitial, setPrevInitial] = useState(initialEpisode)

  if (initialEpisode !== prevInitial) {
    setCurrentEpisode(initialEpisode)
    setPrevInitial(initialEpisode)
  }
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const canDecrease = currentEpisode > 0
  const canIncrease = totalEpisodes === null || currentEpisode < totalEpisodes
  
  let progressPercent = 0
  if (totalEpisodes && totalEpisodes > 0) {
    progressPercent = (currentEpisode / totalEpisodes) * 100
  }

  async function handleUpdate(newEpisode: number) {
    if (newEpisode < 0 || (totalEpisodes !== null && newEpisode > totalEpisodes)) return
    
    setIsLoading(true)
    setError(null)
    
    // Otimista (opcional, mas aqui vamos atualizar após a resposta do servidor para ter 100% consistência)
    const res = await updateAnimeProgress(userAnimeId, newEpisode)
    setIsLoading(false)

    if (res.error) {
      setError(res.error)
    } else {
      setCurrentEpisode(newEpisode)
      startTransition(() => {
        router.refresh()
      })
    }
  }

  return (
    <div className="w-full max-w-sm space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">Progresso</span>
        <span className="text-muted-foreground font-mono">
          Episódio {currentEpisode} {totalEpisodes ? `/ ${totalEpisodes}` : '— total desconhecido'}
        </span>
      </div>

      {totalEpisodes && totalEpisodes > 0 && (
        <div className="h-1 w-full bg-surface-3 rounded-full overflow-hidden">
          <div 
            className="h-full bg-accent transition-[width] duration-320 ease-cinema" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="h-11 w-11 rounded-md px-0"
          onClick={() => handleUpdate(currentEpisode - 1)}
          disabled={!canDecrease || isLoading}
          aria-label="Diminuir episódio"
        >
          <Minus className="w-4 h-4" />
        </Button>
        
        <div className="flex-1 border rounded-md h-11 flex items-center justify-center font-mono text-sm bg-card overflow-hidden">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : isEditing ? (
            <form 
              className="w-full h-full"
              onSubmit={(e) => {
                e.preventDefault()
                const val = parseInt(inputValue, 10)
                if (!isNaN(val)) {
                  handleUpdate(val)
                }
                setIsEditing(false)
              }}
            >
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={totalEpisodes || undefined}
                aria-label="Digite a quantidade de episódios assistidos"
                className="w-full h-full text-center bg-transparent outline-none focus:ring-1 focus:ring-accent"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={() => setIsEditing(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsEditing(false)
                }}
                autoFocus
              />
            </form>
          ) : (
            <button 
              className="w-full h-full flex items-center justify-center hover:bg-surface-2 transition-colors"
              onClick={() => { setIsEditing(true); setInputValue(String(currentEpisode)) }}
              aria-label="Editar quantidade de episódios"
            >
              {currentEpisode}
            </button>
          )}
        </div>

        <Button
          variant="outline"
          className="h-11 w-11 rounded-md px-0"
          onClick={() => handleUpdate(currentEpisode + 1)}
          disabled={!canIncrease || isLoading}
          aria-label="Aumentar episódio"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {error && (
        <div className="text-destructive text-xs text-center">{error}</div>
      )}
    </div>
  )
}
