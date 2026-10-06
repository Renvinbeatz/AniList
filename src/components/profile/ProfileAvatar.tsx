import { AVATAR_PRESETS } from '@/lib/validations/profile'

export function ProfileAvatar({ preset, className = '' }: { preset: string | null; className?: string }) {
  const avatar = AVATAR_PRESETS.find(item => item.id === preset) ?? AVATAR_PRESETS[0]
  return <span role="img" aria-label={`Avatar ${avatar.label.toLowerCase()}`}
    className={`inline-flex shrink-0 items-center justify-center rounded-2xl border border-white/10 ${className}`}
    style={{ backgroundColor: avatar.color }}>
    <span aria-hidden="true" className="h-1/3 w-1/3 rounded-full border-2 border-white/30" />
  </span>
}
