import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPeople } from '@/data/social'
import { usernameFromRoute, publicProfilePath } from '@/lib/public-profile'
import { socialPage } from '@/lib/social'
import { getSession } from '@/lib/session'
import { PeopleList } from '@/components/social/PeopleList'
import { Navigation } from '@/components/Navigation'

export const dynamic = 'force-dynamic'
export default async function ConnectionsPage({ params, searchParams }: PageProps<'/user/[username]/connections'>) {
  const username = usernameFromRoute((await params).username)
  if (!username) notFound()
  const search = await searchParams, mode = search.type === 'following' ? 'following' : 'followers', page = socialPage(search.page)
  if (page === null) notFound()
  const [data, session] = await Promise.all([getPeople('', username, mode, page), getSession()])
  if (!data) notFound()
  const path = `${publicProfilePath(username)}/connections`
  return <><Navigation /><main id="main-content" className="mx-auto w-full max-w-[800px] space-y-6 px-4 pb-32 pt-24">
    <Link href={publicProfilePath(username)}>@{username}</Link><h1 className="text-2xl">{mode === 'followers' ? 'Seguidores' : 'Seguindo'}</h1>
    <nav className="flex gap-6" aria-label="Relações"><Link href={path}>Seguidores</Link><Link href={`${path}?type=following`}>Seguindo</Link></nav>
    <p className="text-sm text-muted-foreground">Exibimos somente os perfis visíveis para você.</p><PeopleList people={data.items} signedIn={!!session} />
    <nav className="flex justify-between" aria-label="Paginação de relações">{page>1 && <Link href={`${path}?type=${mode}&page=${page-1}`}>Anterior</Link>}{page*20<data.total && <Link href={`${path}?type=${mode}&page=${page+1}`}>Próxima</Link>}</nav>
  </main></>
}
