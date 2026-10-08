import Image from 'next/image'
import { resolveAvatarPreset } from '@/lib/validations/profile'

export function ProfileAvatar({ preset, className = '' }: { preset: string | null; className?: string }) {
  const avatar = resolveAvatarPreset(preset)
  return <span role="img" aria-label={avatar.description}
    className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 ${className}`}
    style={{ backgroundColor: avatar.color }}>
    <Image src={avatar.art} alt="" width={256} height={256} unoptimized className="h-full w-full object-cover" />
  </span>
}
