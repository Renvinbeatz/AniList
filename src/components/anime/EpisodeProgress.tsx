'use client'

import { useState } from 'react'
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
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
            className="h-full bg-accent transition-[width] duration-300 ease-out" 
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
        
        <div className="flex-1 border rounded-md h-11 flex items-center justify-center font-mono text-sm bg-card">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : currentEpisode}
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
