import Link from 'next/link'
import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import { FollowButton } from './FollowButton'
import { publicProfilePath } from '@/lib/public-profile'
import type { Person } from '@/lib/social'

export function PeopleList({ people, signedIn }: { people: Person[]; signedIn: boolean }) {
  return <div className="space-y-3">{people.length === 0 && <p className="text-muted-foreground">Nenhuma pessoa encontrada.</p>}
    {people.map(person => <article key={person.username} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border p-4">
      <Link href={publicProfilePath(person.username)} className="flex min-w-0 items-center gap-3">
        <ProfileAvatar preset={person.avatar_preset} className="h-12 w-12 shrink-0" />
        <div className="min-w-0 break-all"><p>{person.display_name || person.username}</p><p className="text-sm text-muted-foreground">@{person.username}</p></div>
      </Link>
      {signedIn && !person.is_owner && <FollowButton username={person.username} following={person.is_following} />}
    </article>)}
  </div>
}
