import Link from 'next/link'
import {getFeed,getActivitySetting} from '@/data/community'
import {socialPage} from '@/lib/social'
import {Navigation} from '@/components/Navigation'
import {FeedCard} from '@/components/social/FeedCard'
import {ActivitySetting} from '@/components/social/ActivitySetting'
export const metadata={title:'Comunidade'}
export default async function CommunityPage({searchParams}:PageProps<'/community'>) {
 const search=await searchParams,mode=search.feed==='following'?'following':'all',page=socialPage(search.page)
 const [feed,setting]=await Promise.all([page?getFeed(mode,page):null,getActivitySetting()])
 return <><Navigation/><main id="main-content" className="mx-auto w-full max-w-[800px] space-y-6 px-4 pb-32 pt-24">
 <div className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-2xl font-semibold">Comunidade</h1><Link href={setting?'/community/new':'/login'} className="min-h-11 content-center rounded-full border border-border px-4">Criar tópico</Link></div>
 <p className="text-muted-foreground">Converse sobre animes, compartilhe descobertas e acompanhe pessoas.</p><nav aria-label="Feed" className="flex flex-wrap gap-6"><Link href="/community">Comunidade geral</Link><Link href="/community?feed=following">Seguindo</Link><Link href="/people">Encontrar pessoas</Link></nav>
 {setting&&<><ActivitySetting enabled={setting.share_library_activity} visibility={setting.profile_visibility}/><Link className="inline-flex min-h-11 items-center text-sm text-muted-foreground" href="/community/blocked">Gerenciar bloqueios</Link></>}
 {feed?feed.items.length?feed.items.map(item=><FeedCard key={item.id} item={item}/>):<p className="text-muted-foreground">Ainda não há publicações neste feed.</p>:<p role="alert">Página inválida.</p>}
 {feed&&<nav aria-label="Paginação do feed" className="flex justify-between">{feed.page>1&&<Link href={`/community?feed=${mode}&page=${feed.page-1}`}>Anterior</Link>}{feed.page*20<feed.total&&<Link href={`/community?feed=${mode}&page=${feed.page+1}`}>Próxima</Link>}</nav>}
 </main></>
}
