import {notFound} from 'next/navigation'
import {supabaseServerClient} from '@/data/supabase'
import {isPlatformAnimeId} from '@/lib/platforms'
import {getFeed} from '@/data/community'
import {socialPage} from '@/lib/social'
import {FeedCard} from '@/components/social/FeedCard'
import {Navigation} from '@/components/Navigation'
import Link from 'next/link'
export default async function ReviewsPage({params,searchParams}:PageProps<'/anime/[anilistId]/reviews'>) {
 const id=Number((await params).anilistId),page=socialPage((await searchParams).page);if(!isPlatformAnimeId(id)||page===null)notFound()
 const {data:anime,error}=await supabaseServerClient.from('anime').select('id,title_romaji').eq('anilist_id',id).maybeSingle()
 if(error)throw new Error('Não foi possível carregar o anime.');if(!anime)notFound()
 const feed=await getFeed('all',page,null,anime.id)
 return <><Navigation/><main id="main-content" className="mx-auto w-full max-w-[800px] space-y-6 px-4 pb-32 pt-24"><h1 className="text-2xl">Reviews · {anime.title_romaji}</h1><Link href={`/anime/${id}`}>Voltar ao anime</Link>{feed.items.map(item=><FeedCard key={item.id} item={item}/>)}{!feed.items.length&&<p>Nenhuma review encontrada.</p>}<nav className="flex justify-between" aria-label="Paginação de reviews">{page>1&&<Link href={`?page=${page-1}`}>Anterior</Link>}{page*20<feed.total&&<Link href={`?page=${page+1}`}>Próxima</Link>}</nav></main></>
}
