'use client'

import { useState, useEffect } from 'react'
import { CalendarAiring } from '@/data/airing'
import Image from 'next/image'
import Link from 'next/link'
import { EmptyState } from '@/components/ui/empty-state'

type DayGroup = {
  date: Date
  label: string
  shortLabel: string
  dayName: string
  isToday: boolean
  airings: CalendarAiring[]
}

export function CalendarClient({ initialAirings }: { initialAirings: CalendarAiring[] }) {
  const [mounted, setMounted] = useState(false)
  const [dayGroups, setDayGroups] = useState<DayGroup[]>([])
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    const groups: DayGroup[] = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(todayStart)
      date.setDate(date.getDate() + i)
      
      const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
      const dayNum = date.toLocaleDateString('pt-BR', { day: '2-digit' })
      
      let label = date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })
      label = label.charAt(0).toUpperCase() + label.slice(1)
      
      if (i === 0) label = `Hoje • ${label}`
      else if (i === 1) label = `Amanhã • ${label}`
      
      return {
        date,
        label,
        shortLabel: dayNum,
        dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        isToday: i === 0,
        airings: [],
      }
    })

    initialAirings.forEach((airing) => {
      const airingDate = new Date(airing.airing_at)
      if (airingDate.getTime() <= now.getTime()) return
      
      const airingDayStart = new Date(airingDate.getFullYear(), airingDate.getMonth(), airingDate.getDate()).getTime()
      const groupIndex = groups.findIndex(g => g.date.getTime() === airingDayStart)
      
      if (groupIndex !== -1) {
        groups[groupIndex].airings.push(airing)
      }
    })

    groups.forEach(g => {
      g.airings.sort((a, b) => new Date(a.airing_at).getTime() - new Date(b.airing_at).getTime())
    })
    
    setDayGroups(groups)
    
    // Auto-select first day with airings, fallback to 0
    const firstWithAirings = groups.findIndex(g => g.airings.length > 0)
    setSelectedDayIdx(firstWithAirings !== -1 ? firstWithAirings : 0)
  }, [initialAirings])

  if (!mounted) {
    return <div className="h-64" /> // Placeholder discreto no SSR
  }

  const allEmpty = dayGroups.every(g => g.airings.length === 0)

  if (allEmpty) {
    return (
      <EmptyState
        title="Sua semana está livre."
        description="Não há lançamentos previstos para os animes da sua lista nos próximos 7 dias."
      />
    )
  }

  const selectedGroup = dayGroups[selectedDayIdx]

  return (
    <div className="space-y-10 max-w-3xl">
      {/* Pills Horizontais */}
      <div aria-label="Dias da semana" className="flex gap-2 justify-start items-center bg-surface-2/50 p-2 rounded-2xl border border-border/50 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
        {dayGroups.map((group, idx) => {
          const isSelected = selectedDayIdx === idx
          const hasAirings = group.airings.length > 0
          
          return (
            <button
              key={idx}
              aria-pressed={isSelected}
              onClick={() => setSelectedDayIdx(idx)}
              className={`flex flex-col items-center justify-center py-2 px-4 rounded-xl min-w-[72px] transition-colors duration-220 ease-cinema focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent snap-center ${
                isSelected 
                  ? 'bg-surface-3 text-foreground shadow-sm' 
                  : 'hover:bg-surface-2 text-muted-foreground opacity-70 hover:opacity-100'
              }`}
            >
              <span className="text-small font-medium mb-1">
                {group.isToday ? 'Hoje' : group.dayName}
              </span>
              <span className={`text-h3 leading-none ${isSelected ? 'font-semibold' : ''}`}>
                {group.shortLabel}
              </span>
              <div className={`w-1 h-1 rounded-full mt-1.5 transition-colors ${hasAirings ? (isSelected ? 'bg-accent' : 'bg-muted-foreground') : 'bg-transparent'}`} />
            </button>
          )
        })}
      </div>

      {/* Lista Editorial Vertical */}
      <section className="space-y-6 pt-2">
        <div className="flex items-center justify-between pb-2 border-b border-border/50">
          <h2 className="text-body font-medium text-muted-foreground">{selectedGroup?.label}</h2>
          <span className="text-muted-foreground text-small font-mono opacity-60">
            {selectedGroup?.airings.length} {selectedGroup?.airings.length === 1 ? 'lançamento' : 'lançamentos'}
          </span>
        </div>
        
        {selectedGroup && selectedGroup.airings.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-body opacity-80">
            Nada previsto para este dia.
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {selectedGroup?.airings.map((airing) => (
              <AiringCard key={airing.anilist_airing_id} airing={airing} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function AiringCard({ airing }: { airing: CalendarAiring }) {
  const anime = airing.anime
  const airingDate = new Date(airing.airing_at)
  const timeString = airingDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const userStatus = anime.user_anime[0]?.status

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
        </div>
        
        <div className="mt-1 text-caption text-muted-foreground opacity-80 flex items-center gap-1.5">
          {userStatus === 'watching' ? (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-watching)]" />
              Assistindo
            </span>
          ) : userStatus === 'planned' ? (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-planned)]" />
              Planejado
            </span>
          ) : null}
          {anime.user_anime[0]?.current_episode !== undefined && (
            <>
              <span>&middot;</span>
              <span>Atual: Ep {anime.user_anime[0].current_episode}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
