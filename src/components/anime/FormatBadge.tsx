import { Film, Tv, MonitorPlay, Music, Disc } from 'lucide-react'

export interface FormatBadgeProps {
  format?: string | null
  className?: string
}

export function getFormatInfo(format?: string | null) {
  let label = ''
  let Icon = Tv

  if (!format) return null

  switch (format.toUpperCase()) {
    case 'MOVIE':
      label = 'Filme'
      Icon = Film
      break
    case 'TV':
    case 'TV_SHORT':
      label = 'Série'
      Icon = Tv
      break
    case 'ONA':
      label = 'ONA'
      Icon = MonitorPlay
      break
    case 'OVA':
      label = 'OVA'
      Icon = Disc
      break
    case 'SPECIAL':
      label = 'Especial'
      Icon = MonitorPlay
      break
    case 'MUSIC':
      label = 'Música'
      Icon = Music
      break
    default:
      return null
  }

  return { label, Icon }
}

export function FormatBadge({ format, className }: FormatBadgeProps) {
  const info = getFormatInfo(format)
  if (!info) return null

  const { label, Icon } = info

  return (
    <div className={`flex items-center gap-1 bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] text-white shadow-sm border border-white/10 uppercase tracking-wider font-medium ${className || ''}`}>
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </div>
  )
}
