'use client'

import { useState, useTransition } from 'react'
import { Platform, UserAnimePlatform } from '@/data/platforms'
import { addPlatformAction, removePlatformAction } from '@/actions/platforms'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, ExternalLink, X, Tv } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface PlatformControlsProps {
  anilistId: number
  userPlatforms: UserAnimePlatform[]
  availablePlatforms: Platform[]
}

export function PlatformControls({ anilistId, userPlatforms, availablePlatforms }: PlatformControlsProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const unselectedPlatforms = availablePlatforms.filter(
    (ap) => !userPlatforms.some((up) => up.platform_id === ap.id)
  )

  const handleAdd = (platformId: string) => {
    startTransition(async () => {
      setError(null)
      const res = await addPlatformAction(anilistId, platformId)
      if (res.error) {
        setError(res.error)
      }
    })
  }

  const handleRemove = (platformId: string) => {
    startTransition(async () => {
      setError(null)
      const res = await removePlatformAction(anilistId, platformId)
      if (res.error) {
        setError(res.error)
      }
    })
  }

  return (
    <div className="space-y-4 pt-4 border-t border-border/50">
      <div className="flex items-center justify-between">
        <h3 className="text-small font-medium text-muted-foreground flex items-center gap-2">
          <Tv className="w-4 h-4" />
          Onde assistir
        </h3>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="h-11 text-xs px-4 bg-card hover:bg-muted min-h-[44px]"
              disabled={isPending || unselectedPlatforms.length === 0}
            >
              <Plus className="w-3 h-3 mr-1" />
              Adicionar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Selecione a plataforma</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {unselectedPlatforms.length === 0 && (
              <div className="p-2 text-sm text-muted-foreground text-center">Nenhuma disponível</div>
            )}
            {unselectedPlatforms.map((platform) => (
              <DropdownMenuItem
                key={platform.id}
                onClick={() => handleAdd(platform.id)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2 w-full">
                  {platform.logo_url && (
                    <div className="w-4 h-4 relative bg-foreground/10 rounded-sm overflow-hidden flex-shrink-0">
                      <Image src={platform.logo_url} alt={platform.name} fill sizes="16px" className="object-contain" />
                    </div>
                  )}
                  <span>{platform.name}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {error && (
        <div className="text-destructive text-xs bg-destructive/10 p-2 rounded-md">
          {error}
        </div>
      )}

      {userPlatforms.length === 0 ? (
        <div className="text-sm text-muted-foreground italic">
          Nenhuma plataforma adicionada.
        </div>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {userPlatforms.map((up) => (
            <li 
              key={up.id} 
              className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm border border-border/50 group"
            >
              <div className="flex items-center gap-2">
                {up.platform.logo_url && (
                  <div className="w-4 h-4 relative bg-foreground/10 rounded-sm overflow-hidden flex-shrink-0">
                    <Image src={up.platform.logo_url} alt={up.platform.name} fill sizes="16px" className="object-contain" />
                  </div>
                )}
                <span className="font-medium">{up.platform.name}</span>
              </div>
              
              <div className="flex items-center gap-1 ml-2 border-l border-border/50 pl-2">
                {up.platform.website_url && (
                  <Link 
                    href={up.platform.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-background/50 rounded text-muted-foreground hover:text-primary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label={`Abrir site de ${up.platform.name}`}
                    title="Abrir site"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}
                <button
                  onClick={() => handleRemove(up.platform_id)}
                  disabled={isPending}
                  className="p-1 hover:bg-destructive/20 rounded text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label={`Remover plataforma ${up.platform.name}`}
                  title="Remover"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
