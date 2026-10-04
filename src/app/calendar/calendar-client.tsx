'use client'

import { useState, useEffect } from 'react'
import { CalendarAiring } from '@/data/airing'
import Image from 'next/image'
import Link from 'next/link'
import { Clock } from 'lucide-react'

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
    return (
      <div className="flex justify-center items-center py-20 text-muted-foreground">
        <Clock className="w-6 h-6 mr-2 animate-spin" />
      </div>
    )
  }

  const allEmpty = dayGroups.every(g => g.airings.length === 0)

  if (allEmpty) {
    return (
      <div className="bg-surface-1 border border-border rounded-xl p-12 text-center space-y-4 mt-8 max-w-2xl mx-auto">
        <h2 className="text-h3 text-foreground">Sua semana está livre.</h2>
        <p className="text-body text-muted-foreground">
          Não há lançamentos previstos para os animes da sua lista nos próximos 7 dias.
        </p>
      </div>
    )
  }

  const selectedGroup = dayGroups[selectedDayIdx]

  return (
    <div className="space-y-10 max-w-3xl mx-auto">
      {/* Pills Horizontais */}
      <div className="flex gap-2 justify-start sm:justify-between items-center bg-surface-1 p-2 rounded-2xl border border-border overflow-x-auto scrollbar-hide">
        {dayGroups.map((group, idx) => {
          const isSelected = selectedDayIdx === idx
          const hasAirings = group.airings.length > 0
          
          return (
            <button
              key={idx}
              onClick={() => setSelectedDayIdx(idx)}
              className={`flex flex-col items-center justify-center py-2 px-4 rounded-xl min-w-[72px] transition-all duration-200 ${
                isSelected 
                  ? 'bg-surface-3 border border-border-strong shadow-lg' 
                  : 'hover:bg-surface-2 border border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <span className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                {group.isToday ? 'Hoje' : group.dayName}
              </span>
              <span className={`text-h3 leading-none ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                {group.shortLabel}
              </span>
              {/* Dot indicator if has airings */}
              <div className={`w-1 h-1 rounded-full mt-1.5 transition-colors ${hasAirings ? (isSelected ? 'bg-primary' : 'bg-muted-foreground') : 'bg-transparent'}`} />
            </button>
          )
        })}
      </div>

      {/* Lista Editorial Vertical */}
      <section className="space-y-6 pt-4">
        <div className="flex items-center justify-between pb-4 border-b border-border/50">
          <h2 className="text-h2 text-foreground">{selectedGroup?.label}</h2>
          <span className="text-muted-foreground text-small font-mono">{selectedGroup?.airings.length} lançamentos</span>
        </div>
        
        {selectedGroup && selectedGroup.airings.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-body italic opacity-70">
            Nenhum lançamento previsto para este dia.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
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
      className="group flex flex-col sm:flex-row gap-6 p-4 rounded-2xl border border-transparent hover:border-border hover:bg-surface-1 transition-all duration-300"
    >
      <div className="relative w-full sm:w-[120px] aspect-[16/9] sm:aspect-[3/4] rounded-xl overflow-hidden bg-surface-2 flex-shrink-0">
        {anime.cover_image && (
          <Image 
            src={anime.cover_image} 
            alt="Capa" 
            fill 
            sizes="(max-width: 640px) 100vw, 120px" 
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
          />
        )}
      </div>
      
      <div className="flex flex-col flex-1 min-w-0 py-1 justify-center">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="text-h3 font-semibold text-primary font-mono tracking-tight">{timeString}</span>
            <span className="bg-surface-3 text-foreground px-2 py-0.5 rounded text-caption font-mono border border-border">
              Episódio {airing.episode}
            </span>
          </div>
          <h3 className="font-semibold text-h3 leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {anime.title_romaji || anime.title_english || anime.title_native}
          </h3>
          
          <div className="text-small text-muted-foreground flex items-center gap-2 mt-2">
            {userStatus === 'watching' ? (
              <span className="flex items-center gap-1.5 text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-watching)]" />
                Assistindo
              </span>
            ) : userStatus === 'planned' ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-planned)]" />
                Planejado
              </span>
            ) : null}
            {anime.user_anime[0]?.current_episode !== undefined && (
              <>
                <span>•</span>
                <span>Atual: Ep {anime.user_anime[0].current_episode}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
