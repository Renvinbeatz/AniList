import Link from 'next/link'
import {getFeed} from '@/data/community'
import {FeedCard} from './FeedCard'
export async function AnimeReviews({animeId,anilistId}:{animeId:string;anilistId:number}) {
 const feed=await getFeed('all',1,null,animeId)
 return <section aria-label="Reviews" className="space-y-5 border-t border-border pt-8">
  <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl">Reviews da comunidade</h2><Link className="min-h-11 content-center rounded-full border border-border px-4" href={`/anime/${anilistId}/review`}>Escrever review</Link></div>
  {feed.items.length?feed.items.map(item=><FeedCard key={item.id} item={item}/>):<p className="text-muted-foreground">Nenhuma review pública por enquanto.</p>}
  {feed.total>20&&<Link href={`/anime/${anilistId}/reviews`}>Ver todas as reviews</Link>}
 </section>
}
