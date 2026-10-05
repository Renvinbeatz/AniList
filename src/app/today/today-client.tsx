'use client'

import { useState, useEffect, useMemo } from 'react'
import { CalendarAiring } from '@/data/airing'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, PlayCircle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
    return (
      <div className="flex justify-center items-center py-20 text-muted-foreground">
        <Clock className="w-6 h-6 mr-2 animate-spin" />
      </div>
    )
  }

  const hasAnyAiring = pastAirings.length > 0 || futureAirings.length > 0 || nextAiring !== null

  if (!hasAnyAiring) {
    return (
      <div className="bg-surface-1 border border-border rounded-xl p-12 text-center space-y-4 max-w-2xl mx-auto mt-12">
        <h2 className="text-h3 text-foreground">Nada programado para hoje.</h2>
        <p className="text-body text-muted-foreground">
          Nenhum dos animes que você acompanha tem episódio marcado para o dia de hoje.
        </p>
        <div className="pt-6">
          <Button asChild className="px-8 rounded-full bg-surface-2 border border-border hover:bg-surface-3 text-foreground">
            <Link href="/calendar">Ver calendário</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-16 max-w-4xl mx-auto">
      {nextAiring && (
        <section className="space-y-6">
          <h2 className="text-h2 font-semibold tracking-tight text-foreground">
            Próximo Lançamento
          </h2>
          <div>
            <NextAiringCard airing={nextAiring} now={now} />
          </div>
        </section>
      )}

      {futureAirings.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-h3 font-semibold tracking-tight text-muted-foreground border-b border-border/50 pb-2">
            Ainda hoje
          </h2>
          <div className="flex flex-col gap-4">
            {futureAirings.map((airing) => (
              <AiringCard key={airing.anilist_airing_id} airing={airing} />
            ))}
          </div>
        </section>
      )}

      {pastAirings.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-end justify-between border-b border-border/50 pb-2">
            <h2 className="text-h3 font-semibold tracking-tight text-muted-foreground opacity-60">
              Já saiu
            </h2>
          </div>
          <div className="flex flex-col gap-4">
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
      className="group relative flex flex-col sm:flex-row items-stretch gap-6 p-6 sm:p-8 bg-surface-1 border border-border hover:border-primary/50 rounded-2xl transition-colors duration-220 ease-cinema overflow-hidden"
    >
      <div className="relative w-full sm:w-40 aspect-[16/9] sm:aspect-[2/3] rounded-xl overflow-hidden bg-surface-2 flex-shrink-0">
        {anime.cover_image && (
          <Image 
            src={anime.cover_image} 
            alt="Capa" 
            fill 
            sizes="(max-width: 640px) 100vw, 160px" 
            className="object-cover group-hover:scale-[1.02] transition-transform duration-220 ease-cinema" 
          />
        )}
      </div>
      
      <div className="flex flex-col flex-1 min-w-0 py-2 justify-center z-10">
        <div className="text-primary font-mono text-small mb-2 uppercase tracking-wider flex items-center gap-1.5">
          <PlayCircle className="w-4 h-4" />
          Episódio {airing.episode}
        </div>
        
        <h3 className="font-semibold text-h2 leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors mb-6">
          {anime.title_romaji || anime.title_english || anime.title_native}
        </h3>
        
        <div className="mt-auto flex gap-6 sm:gap-12 items-end">
          <div>
            <div className="text-caption text-muted-foreground uppercase tracking-widest mb-1">Horário</div>
            <div className="text-h3 font-mono font-medium text-foreground">{timeString}</div>
          </div>
          <div>
            <div className="text-caption text-muted-foreground uppercase tracking-widest mb-1">Faltam</div>
            <div className="text-h3 font-mono font-medium text-primary">{countdownStr}</div>
          </div>
        </div>
      </div>
      
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/10 transition-colors" />
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
      className={`group flex items-center gap-6 p-4 bg-surface-1 border border-border rounded-xl hover:border-primary/30 transition-colors duration-220 ease-cinema ${isPast ? 'opacity-50 hover:opacity-100 grayscale hover:grayscale-0' : ''}`}
    >
      <div className="relative w-20 h-28 rounded-lg overflow-hidden bg-surface-3 flex-shrink-0">
        {anime.cover_image && (
          <Image 
            src={anime.cover_image} 
            alt="Capa" 
            fill 
            sizes="80px" 
            className="object-cover transition-transform duration-220 ease-cinema group-hover:scale-[1.02]" 
          />
        )}
      </div>
      
      <div className="flex flex-col flex-1 min-w-0 py-1">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-h3 font-mono font-medium text-foreground">{timeString}</span>
          <span className="bg-surface-3 border border-border px-2 py-0.5 rounded text-caption font-mono text-muted-foreground">
            Ep {airing.episode}
          </span>
          {isPlusOne && (
            <span className="ml-2 flex items-center text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
              <Plus className="w-3 h-3 mr-0.5" /> Próximo
            </span>
          )}
        </div>
        
        <h3 className="font-semibold text-body leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
          {anime.title_romaji || anime.title_english || anime.title_native}
        </h3>
        
        <div className="mt-2 text-caption text-muted-foreground">
          {anime.user_anime[0]?.status === 'watching' ? 'Assistindo' : 'Planejado'}
          {anime.user_anime[0]?.current_episode !== undefined ? ` • Atual: Ep ${anime.user_anime[0].current_episode}` : ''}
        </div>
      </div>
    </Link>
  )
}
