import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublicLibrary } from '@/data/public-library'
import { publicLibraryFilter, publicLibraryPath } from '@/lib/public-library'
import { publicProfilePath, usernameFromRoute } from '@/lib/public-profile'
import { LIBRARY_STATUS, STATUS_LABELS } from '@/lib/constants'
import { PublicLibraryCover } from '@/components/profile/PublicLibraryCover'
import { BrandLogo } from '@/components/brand/BrandLogo'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Biblioteca' }

export default async function PublicLibraryPage({ params, searchParams }: PageProps<'/user/[username]/library'>) {
  const { username: segment } = await params
  const query = await searchParams
  const username = usernameFromRoute(segment)
  const filter = publicLibraryFilter(query.status, query.page)
  if (!username || !filter) notFound()
  const result = await getPublicLibrary(username, filter)
  if ('error' in result) throw new Error(result.error)
  if (!result.data) notFound()
  const library = result.data
  const pages = Math.max(1, Math.ceil(library.total_items / library.page_size))
  const tabs = [{ label: 'Todos', status: null, count: library.counts.total },
    ...Object.values(LIBRARY_STATUS).map(status => ({ label: STATUS_LABELS[status], status, count: library.counts[status] }))]
  return <main id="main-content" className="mx-auto w-full max-w-[1000px] space-y-8 px-4 py-8 pb-16 sm:px-6">
    <div className="flex items-center justify-between gap-4 border-b border-border/50 pb-5">
      <Link href="/" aria-label="Anicat — Início" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><BrandLogo /></Link>
      <Link href={publicProfilePath(library.username)} className="inline-flex min-h-11 items-center rounded-lg text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Voltar ao perfil</Link>
    </div>
    <header className="space-y-3">
      <h1 className="break-all text-h2 font-semibold">Biblioteca de @{library.username}</h1>
      <p className="text-sm text-muted-foreground">{library.counts.total} animes</p>
      {library.profile_visibility === 'private' && <p className="text-sm text-muted-foreground">Perfil privado · Visível apenas para você.</p>}
    </header>
    <nav aria-label="Categorias da biblioteca" className="flex flex-wrap gap-2">
      {tabs.map(tab => <Link key={tab.label} href={publicLibraryPath(library.username, tab.status)} prefetch={false}
        aria-current={filter.status === tab.status ? 'page' : undefined}
        className="rounded-full border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground aria-current:bg-surface-2 aria-current:text-foreground">
        {tab.label} <span className="ml-1">{tab.count}</span>
      </Link>)}
    </nav>
    {library.items.length === 0 ? <p role="status" className="rounded-xl bg-surface-2/30 px-6 py-16 text-center text-muted-foreground">
      {library.counts.total === 0 ? 'Esta biblioteca está vazia.' : 'Nenhum anime nesta categoria.'}
    </p> : <ul aria-label="Animes da biblioteca" className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4">
      {library.items.map(item => <li key={item.anilist_id} className="min-w-0">
        <Link href={`/anime/${item.anilist_id}`} prefetch={false} className="block space-y-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <PublicLibraryCover key={item.cover_image} url={item.cover_image} />
          <h2 className="break-words text-sm font-medium">{item.title}</h2>
          <p className="text-xs text-muted-foreground">{STATUS_LABELS[item.status]}</p>
        </Link>
      </li>)}
    </ul>}
    {pages > 1 && <nav aria-label="Páginas da biblioteca" className="flex flex-wrap items-center justify-center gap-5 text-sm">
      {library.page > 1 && <Link href={publicLibraryPath(library.username, filter.status, library.page - 1)} prefetch={false}>Anterior</Link>}
      <span className="text-muted-foreground">Página {library.page} de {pages}</span>
      {library.page < pages && <Link href={publicLibraryPath(library.username, filter.status, library.page + 1)} prefetch={false}>Próxima</Link>}
    </nav>}
  </main>
}
