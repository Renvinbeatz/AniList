import Link from 'next/link'
import { getRelationship } from '@/data/social'
import { getSession } from '@/lib/session'
import { publicProfilePath } from '@/lib/public-profile'
import { FollowButton } from './FollowButton'
import { BlockControl } from './BlockControl'

export async function ProfileConnections({ username, owner }: { username: string; owner: boolean }) {
  const [relation, session] = await Promise.all([getRelationship(username), getSession()])
  if (!relation) return null
  const path = `${publicProfilePath(username)}/connections`
  return <section aria-label="Conexões" className="flex flex-wrap items-center gap-4 text-sm">
    <Link className="min-h-11 content-center" href={path}>{relation.followers} seguidores</Link>
    <Link className="min-h-11 content-center" href={`${path}?type=following`}>{relation.following_count} seguindo</Link>
    {!owner && (session ? <FollowButton username={username} following={relation.following} /> : <Link href="/login">Entre para seguir</Link>)}
    {!owner && session && <BlockControl username={username} />}
  </section>
}
