'use client'

import { useState, useEffect, useMemo } from 'react'
import { CalendarAiring } from '@/data/airing'
import Image from 'next/image'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

export function TodayClient({ initialAirings }: { initialAirings: CalendarAiring[] }) {
  const [mounted, setMounted] = useState(false)
  const [now, setNow] = useState<number>(0)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    setNow(Date.now())

    // Atualiza o relógio a cada 1 segundo para manter o countdown e
    // reclassificar automaticamente os episódios quando lançam.
    const intervalId = setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => clearInterval(intervalId)
  }, [])

  const { pastAirings, futureAirings, nextAiring } = useMemo(() => {
    if (!mounted || now === 0) {
      return { pastAirings: [], futureAirings: [], nextAiring: null }
    }

    const localNowDate = new Date(now)
    const startOfToday = new Date(localNowDate.getFullYear(), localNowDate.getMonth(), localNowDate.getDate()).getTime()
    const endOfToday = startOfToday + 24 * 60 * 60 * 1000

    // Filtra para manter somente episódios do dia local "hoje"
    const todayAirings = initialAirings.filter((airing) => {
      const t = new Date(airing.airing_at).getTime()
      return t >= startOfToday && t < endOfToday
    })

    // Ordena cronologicamente
    todayAirings.sort((a, b) => new Date(a.airing_at).getTime() - new Date(b.airing_at).getTime())

    const past: CalendarAiring[] = []
    const future: CalendarAiring[] = []

    todayAirings.forEach((airing) => {
      if (new Date(airing.airing_at).getTime() <= now) {
        past.push(airing)
      } else {
        future.push(airing)
      }
    })

    const next = future.length > 0 ? future[0] : null
    const remainingFuture = future.slice(1)

    return {
      pastAirings: past,
      futureAirings: remainingFuture,
      nextAiring: next
    }
  }, [initialAirings, mounted, now])

  if (!mounted) {
    return <div className="h-64" /> // Placeholder discreto no SSR
  }

  const hasAnyAiring = pastAirings.length > 0 || futureAirings.length > 0 || nextAiring !== null

  if (!hasAnyAiring) {
    return (
      <EmptyState 
        title="Nenhum episódio previsto para hoje."
        description="Acompanhe os próximos lançamentos no calendário geral."
        action={
          <Button asChild variant="secondary" className="rounded-full px-8">
            <Link href="/calendar">Ver calendário</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-12 max-w-3xl">
      {nextAiring && (
        <section className="space-y-4">
          <h2 className="text-h3 font-medium text-foreground">
            Próximo lançamento
          </h2>
          <NextAiringCard airing={nextAiring} now={now} />
        </section>
      )}

      {futureAirings.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-body font-medium text-muted-foreground pb-2 border-b border-border/50">
            Ainda hoje
          </h2>
          <div className="flex flex-col gap-6">
            {futureAirings.map((airing) => (
              <AiringCard key={airing.anilist_airing_id} airing={airing} />
            ))}
          </div>
        </section>
      )}

      {pastAirings.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-body font-medium text-muted-foreground opacity-60 pb-2 border-b border-border/50">
            Já saiu
          </h2>
          <div className="flex flex-col gap-6 opacity-60 hover:opacity-100 transition-opacity duration-320">
            {pastAirings.map((airing) => (
              <AiringCard key={airing.anilist_airing_id} airing={airing} isPast />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function NextAiringCard({ airing, now }: { airing: CalendarAiring, now: number }) {
  const anime = airing.anime
  const airingDate = new Date(airing.airing_at)
  const timeString = airingDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  
  const diffMs = Math.max(0, airingDate.getTime() - now)
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  let countdownStr = ''
  if (diffHours > 0) {
    countdownStr = `Em ${diffHours}h ${diffMinutes}m`
  } else if (diffMinutes > 0) {
    countdownStr = `Em ${diffMinutes}m`
  } else {
    countdownStr = 'Agora'
  }

  return (
    <Link 
      href={`/anime/${anime.anilist_id}`}
      className="group flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 rounded-md transition-colors duration-220 ease-cinema focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="relative w-28 sm:w-32 aspect-[2/3] rounded-md overflow-hidden bg-surface-2 flex-shrink-0">
        {anime.cover_image && (
          <Image 
            src={anime.cover_image} 
            alt={anime.title_romaji || 'Capa'} 
            fill 
            sizes="(max-width: 640px) 112px, 128px" 
            className="object-cover group-hover:scale-[1.02] transition-transform duration-220 ease-cinema" 
          />
        )}
      </div>
      
      <div className="flex flex-col flex-1 min-w-0 py-2 justify-center">
        {/* Indicador temporal discreto para o próximo */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span className="text-small text-accent font-medium">
            {countdownStr}
          </span>
        </div>
        
        <h3 className="font-semibold text-h3 leading-tight line-clamp-2 text-foreground group-hover:opacity-80 transition-opacity">
          {anime.title_romaji || anime.title_english || anime.title_native}
        </h3>
        
        <div className="flex items-center gap-2 text-body text-muted-foreground mt-2">
          <span className="font-medium text-foreground">{timeString}</span>
          <span>&middot;</span>
          <span>Episódio {airing.episode}</span>
        </div>
      </div>
    </Link>
  )
}

function AiringCard({ airing, isPast = false }: { airing: CalendarAiring, isPast?: boolean }) {
  const anime = airing.anime
  const airingDate = new Date(airing.airing_at)
  const timeString = airingDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  
  const currentEp = anime.user_anime[0]?.current_episode ?? 0
  const isPlusOne = isPast && currentEp < airing.episode

  return (
    <Link 
      href={`/anime/${anime.anilist_id}`}
      className="group flex flex-row items-center gap-4 rounded-md transition-opacity duration-220 ease-cinema focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent hover:opacity-80"
    >
      <div className="relative w-16 h-24 sm:w-20 sm:h-28 rounded-md overflow-hidden bg-surface-2 flex-shrink-0">
        {anime.cover_image && (
          <Image 
            src={anime.cover_image} 
            alt={anime.title_romaji || 'Capa'} 
            fill 
            sizes="80px" 
            className="object-cover transition-transform duration-220 ease-cinema group-hover:scale-[1.02]" 
          />
        )}
      </div>
      
      <div className="flex flex-col flex-1 min-w-0 py-1">
        <h3 className="font-medium text-body leading-tight line-clamp-1 text-foreground">
          {anime.title_romaji || anime.title_english || anime.title_native}
        </h3>
        
        <div className="flex items-center gap-2 mt-1.5 text-small text-muted-foreground">
          <span className="font-medium text-foreground">{timeString}</span>
          <span>&middot;</span>
          <span>Episódio {airing.episode}</span>
          {isPlusOne && (
            <>
              <span>&middot;</span>
              <span className="flex items-center text-accent">
                <Plus className="w-3 h-3 mr-0.5" /> Próximo
              </span>
            </>
          )}
        </div>
        
        <div className="mt-1 text-caption text-muted-foreground opacity-80">
          {anime.user_anime[0]?.status === 'watching' ? 'Assistindo' : 'Planejado'}
          {anime.user_anime[0]?.current_episode !== undefined ? ` · Atual: Ep ${anime.user_anime[0].current_episode}` : ''}
        </div>
      </div>
    </Link>
  )
}
