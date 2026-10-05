'use client'

import { useSyncExternalStore } from 'react'
import { CalendarClock } from 'lucide-react'

interface NextEpisodeProps {
  episode: number
  /** Instante UTC (ISO 8601) vindo de `airing_schedule.airing_at`. */
  airingAt: string
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

function formatAiring(airingAt: string): string | null {
  const date = new Date(airingAt)
  if (Number.isNaN(date.getTime())) return null

  // Converte para o fuso do navegador somente na exibição; o valor armazenado continua em UTC.
  const absolute = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)

  const diff = date.getTime() - Date.now()
  const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })
  let relative: string
  if (diff < HOUR) {
    relative = rtf.format(Math.max(1, Math.ceil(diff / MINUTE)), 'minute')
  } else if (diff < DAY) {
    relative = rtf.format(Math.floor(diff / HOUR), 'hour')
  } else {
    relative = rtf.format(Math.floor(diff / DAY), 'day')
  }

  return `${absolute} · ${relative}`
}

const subscribe = () => () => {}
const getServerSnapshot = () => null

export function NextEpisode({ episode, airingAt }: NextEpisodeProps) {
  // No servidor não sabemos o fuso do usuário: renderiza só o episódio e completa a data após hidratar.
  const when = useSyncExternalStore(subscribe, () => formatAiring(airingAt), getServerSnapshot)

  return (
    <div className="inline-flex items-start gap-3 py-1 text-small">
      <CalendarClock className="h-5 w-5 shrink-0 text-text-3 mt-0.5" aria-hidden="true" />
      <div className="text-left space-y-1">
        <p className="text-caption uppercase tracking-widest text-text-3 font-medium">Próximo episódio</p>
        <p className="font-medium text-foreground">
          Episódio {episode}
          {when && (
            <>
              {' • '}
              <time dateTime={airingAt} className="text-muted-foreground font-normal">
                {when}
              </time>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
