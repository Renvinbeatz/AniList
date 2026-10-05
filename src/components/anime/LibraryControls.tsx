'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Loader2, ChevronDown, CircleDashed, Bookmark, CirclePause, CircleCheck, CircleX } from 'lucide-react'
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
  [LIBRARY_STATUS.WATCHING]: CircleDashed,
  [LIBRARY_STATUS.PLANNED]: Bookmark,
  [LIBRARY_STATUS.PAUSED]: CirclePause,
  [LIBRARY_STATUS.COMPLETED]: CircleCheck,
  [LIBRARY_STATUS.DROPPED]: CircleX,
}

export function LibraryControls({ animeId, initialUserAnime }: LibraryControlsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [userAnime, setUserAnime] = useState<UserAnimeRecord | null>(initialUserAnime)
  const [prevInitial, setPrevInitial] = useState<UserAnimeRecord | null>(initialUserAnime)

  if (initialUserAnime !== prevInitial) {
    setUserAnime(initialUserAnime)
    setPrevInitial(initialUserAnime)
  }

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const isActionRunning = isLoading || isPending


  async function handleAdd() {
    setIsLoading(true)
    setError(null)
    const res = await addAnimeToLibrary(animeId)
    setIsLoading(false)

    if (res.error) {
      setError(res.error)
    } else {
      startTransition(() => {
        router.refresh()
      })
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
    } else {
      setUserAnime({ ...userAnime, status: newStatus })
      startTransition(() => {
        router.refresh()
      })
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
      startTransition(() => {
        router.refresh()
      })
    }
  }

  if (error) {
    return <div className="text-destructive text-sm font-medium">{error}</div>
  }

  if (!userAnime) {
    return (
      <Button 
        onClick={handleAdd} 
        disabled={isActionRunning} 
        className="w-full md:w-auto rounded-full font-medium h-12 px-8 bg-foreground text-background hover:bg-foreground/90"
      >
        {isActionRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bookmark className="w-4 h-4 mr-2" />}
        Adicionar à coleção
      </Button>
    )
  }

  const currentStatus = userAnime.status as LibraryStatus
  const StatusIcon = statusIcons[currentStatus] || Bookmark

  return (
    <div className="flex gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={isActionRunning} className="w-full md:w-auto h-12 rounded-full px-6 font-medium text-foreground bg-transparent border-border/50 hover:bg-surface-2 hover:border-border">
            {isActionRunning ? (
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
            <CircleX className="w-4 h-4 mr-2" />
            Remover da coleção
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
