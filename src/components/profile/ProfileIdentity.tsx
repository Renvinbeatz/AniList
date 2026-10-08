import type { ReactNode } from 'react'
import { ProfileAvatar } from './ProfileAvatar'
import { ProfileBanner } from './ProfileBanner'

type Identity = {
  username: string
  display_name: string | null
  bio: string | null
  banner_url: string | null
  avatar_preset: string | null
}

export function ProfileIdentity({ profile, actions, children }: { profile: Identity; actions?: ReactNode; children?: ReactNode }) {
  return <section className="overflow-hidden rounded-3xl border border-border bg-surface-1/40">
    <ProfileBanner key={profile.banner_url} url={profile.banner_url} />
    <div className="relative space-y-5 px-5 pb-6 sm:px-8 sm:pb-8">
      <div className="flex flex-wrap items-end justify-between gap-x-5 gap-y-4">
        <div className="-mt-10 rounded-[22px] bg-background p-1.5 sm:-mt-12">
          <ProfileAvatar preset={profile.avatar_preset} className="h-24 w-24 sm:h-28 sm:w-28" />
        </div>
        {actions && <div className="min-w-0 pb-1 pt-4 text-sm">{actions}</div>}
      </div>
      <div className="min-w-0 space-y-2">
        <h1 className="break-all text-h1 font-semibold text-foreground">{profile.display_name || profile.username}</h1>
        <p className="break-all text-sm text-muted-foreground">@{profile.username}</p>
      </div>
      {profile.bio && <p className="max-w-prose whitespace-pre-wrap break-words text-body text-muted-foreground">{profile.bio}</p>}
      {children}
    </div>
  </section>
}
