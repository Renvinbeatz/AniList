import Link from 'next/link'
import { CollectionCover } from './ProfileAnimeSearch'
import { animeTitle } from '@/lib/profile-anime'
import type { FavoriteCharacterDisplay } from '@/lib/profile-character'
import type { ProfileCollectionsResult } from '@/lib/profile-collections'

export function ProfileHighlights({ collections, favorite }: { collections: ProfileCollectionsResult; favorite: FavoriteCharacterDisplay }) {
  return <>
    {favorite.id !== null && <section aria-labelledby="favorite-heading" className="space-y-4">
      <h2 id="favorite-heading" className="text-body font-medium text-muted-foreground">Personagem favorito</h2>
      <div className="flex items-center gap-4 rounded-xl border border-border/40 bg-surface-2/30 p-4">
        <CollectionCover key={favorite.character?.image} url={favorite.character?.image ?? null} />
        <p>{favorite.character?.name ?? 'Personagem salvo'}{favorite.error && <span className="mt-1 block text-sm text-muted-foreground">Os detalhes estão indisponíveis agora.</span>}</p>
      </div>
    </section>}
    {'error' in collections ? <p role="alert" className="text-sm text-muted-foreground">Não foi possível carregar favoritos e fixados. Recarregue para tentar novamente.</p>
      : (['favorites', 'pinned'] as const).map(kind => {
        const items = collections.data[kind]
        if (!items.length) return null
        const title = kind === 'favorites' ? 'Animes favoritos' : 'Animes fixados'
        return <section key={kind} aria-label={title} className="space-y-4">
          <h2 className="text-body font-medium text-muted-foreground">{title}</h2>
          <ol className="grid gap-3 sm:grid-cols-2">
            {items.map(item => <li key={item.anime_id} value={item.position}>
              <Link href={`/anime/${item.anime.anilist_id}`} className="flex items-center gap-3 rounded-xl border border-border/40 bg-surface-2/30 p-3 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <CollectionCover key={item.anime.cover_image} url={item.anime.cover_image} />
                <span className="min-w-0 break-words text-sm"><span className="mr-2 text-muted-foreground">{item.position}.</span>{animeTitle(item.anime)}</span>
              </Link>
            </li>)}
          </ol>
        </section>
      })}
  </>
}
