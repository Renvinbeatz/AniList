import { getPeople } from '@/data/social'
import { getSession } from '@/lib/session'
import { peopleQuery, socialPage } from '@/lib/social'
import { PeopleList } from '@/components/social/PeopleList'
import { Navigation } from '@/components/Navigation'
import Link from 'next/link'

export const metadata = { title: 'Encontrar pessoas' }
export default async function PeoplePage({ searchParams }: PageProps<'/people'>) {
  const params = await searchParams, query = peopleQuery(params.q ?? ''), page = socialPage(params.page)
  const session = await getSession()
  const data = query !== null && page !== null ? await getPeople(query, null, 'search', page) : null
  return <><Navigation /><main id="main-content" className="mx-auto w-full max-w-[800px] space-y-6 px-4 pb-32 pt-24">
    <h1 className="text-2xl font-semibold">Encontrar pessoas</h1><p className="text-muted-foreground">Conheça os perfis públicos da Anicat.</p>
    <form className="flex gap-2"><label className="sr-only" htmlFor="people-q">Buscar username</label><input id="people-q" name="q" defaultValue={query ?? ''} maxLength={60} className="min-w-0 flex-1 rounded-xl border border-border bg-surface-1 px-3" /><button className="min-h-11 rounded-xl border border-border px-4">Buscar</button></form>
    {data ? <><PeopleList people={data.items} signedIn={!!session} /><nav aria-label="Paginação de pessoas" className="flex justify-between">
      {data.page > 1 && <Link href={`/people?q=${encodeURIComponent(query!)}&page=${data.page-1}`}>Anterior</Link>}
      {data.page*20 < data.total && <Link href={`/people?q=${encodeURIComponent(query!)}&page=${data.page+1}`}>Próxima</Link>}
    </nav></> : <p role="alert">Busca inválida.</p>}
  </main></>
}
