'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Loader2, ChevronDown, Check, Bookmark, Play, Pause, X } from 'lucide-react'
import { addAnimeToLibrary, updateAnimeStatus, removeAnimeFromLibrary } from '@/actions/library'
import { LIBRARY_STATUS, LibraryStatus, STATUS_LABELS } from '@/lib/constants'

// Note: O tipo pode ser simplificado se extrair de database.types
interface UserAnimeRecord {
  id: string
  status: string
}

interface LibraryControlsProps {
  animeId: string
  initialUserAnime: UserAnimeRecord | null
}

const statusIcons: Record<LibraryStatus, React.ElementType> = {
  [LIBRARY_STATUS.WATCHING]: Play,
  [LIBRARY_STATUS.PLANNED]: Bookmark,
  [LIBRARY_STATUS.PAUSED]: Pause,
  [LIBRARY_STATUS.COMPLETED]: Check,
  [LIBRARY_STATUS.DROPPED]: X,
}

export function LibraryControls({ animeId, initialUserAnime }: LibraryControlsProps) {
  const [userAnime, setUserAnime] = useState<UserAnimeRecord | null>(initialUserAnime)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAdd() {
    setIsLoading(true)
    setError(null)
    const res = await addAnimeToLibrary(animeId)
    setIsLoading(false)

    if (res.error) {
      setError(res.error)
    } else {
      // Como não temos o ID gerado aqui facilmente sem mudar a action, 
      // fazemos refresh visual e a revalidação da rota cuidará da consistência final.
      // Uma re-renderização nativa ocorrerá.
    }
  }

  async function handleStatusUpdate(newStatus: LibraryStatus) {
    if (!userAnime) return
    setIsLoading(true)
    setError(null)
    
    const res = await updateAnimeStatus(userAnime.id, newStatus)
    setIsLoading(false)
    
    if (res.error) {
      setError(res.error)
    }
  }

  async function handleRemove() {
    if (!userAnime) return
    const confirmed = window.confirm("Remover este anime da sua biblioteca?")
    if (!confirmed) return

    setIsLoading(true)
    setError(null)

    const res = await removeAnimeFromLibrary(userAnime.id)
    setIsLoading(false)

    if (res.error) {
      setError(res.error)
    } else {
      setUserAnime(null)
    }
  }

  if (error) {
    return <div className="text-destructive text-sm font-medium">{error}</div>
  }

  if (!userAnime) {
    return (
      <Button 
        onClick={handleAdd} 
        disabled={isLoading} 
        className="w-full md:w-auto"
      >
        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bookmark className="w-4 h-4 mr-2" />}
        Adicionar à biblioteca
      </Button>
    )
  }

  const currentStatus = userAnime.status as LibraryStatus
  const StatusIcon = statusIcons[currentStatus] || Bookmark

  return (
    <div className="flex gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" disabled={isLoading} className="w-full md:w-auto">
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <StatusIcon className="w-4 h-4 mr-2" />
            )}
            {STATUS_LABELS[currentStatus]}
            <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {Object.values(LIBRARY_STATUS).map((val) => {
            const Icon = statusIcons[val]
            return (
              <DropdownMenuItem 
                key={val} 
                onClick={() => handleStatusUpdate(val)}
                className={currentStatus === val ? 'bg-secondary' : ''}
              >
                <Icon className="w-4 h-4 mr-2 opacity-70" />
                {STATUS_LABELS[val]}
              </DropdownMenuItem>
            )
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleRemove} className="text-destructive focus:text-destructive">
            <X className="w-4 h-4 mr-2" />
            Remover da biblioteca
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
