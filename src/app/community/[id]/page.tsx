import {notFound} from 'next/navigation'
import {getFeed,getActivitySetting} from '@/data/community'
import {isPlatformId} from '@/lib/platforms'
import {Navigation} from '@/components/Navigation'
import {FeedCard} from '@/components/social/FeedCard'
import {getComments} from '@/data/interactions'
import {getSession} from '@/lib/session'
import {socialPage} from '@/lib/social'
import {Comments} from '@/components/social/Comments'
import Link from 'next/link'
export const dynamic='force-dynamic'
export default async function TopicPage({params,searchParams}:PageProps<'/community/[id]'>){
 const {id}=await params;if(!isPlatformId(id))notFound()
 const feed=await getFeed('all',1,id),topic=feed.items[0];if(!topic||topic.type==='activity')notFound()
 const page=socialPage((await searchParams).page);if(page===null)notFound()
 const [comments,session,setting]=await Promise.all([getComments(id,page),getSession(),getActivitySetting()]);if(!comments)notFound()
 return <><Navigation/><main id="main-content" className="mx-auto w-full max-w-[800px] space-y-6 px-4 pb-32 pt-24"><FeedCard item={topic} detail/><Comments postId={id} items={comments.items} signedIn={!!session} postSpoiler={topic.spoiler} visibility={setting?.profile_visibility}/><nav aria-label="Paginação de comentários" className="flex justify-between">{page>1&&<Link href={`?page=${page-1}`}>Anterior</Link>}{page*30<comments.total&&<Link href={`?page=${page+1}`}>Próxima</Link>}</nav></main></>
}
