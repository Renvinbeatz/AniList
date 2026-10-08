import {redirect,notFound} from 'next/navigation'
import Link from 'next/link'
import {getNotifications} from '@/data/interactions'
import {socialPage} from '@/lib/social'
import {publicProfilePath} from '@/lib/public-profile'
import {Navigation} from '@/components/Navigation'
import {NotificationControls} from '@/components/social/NotificationControls'
export default async function NotificationsPage({searchParams}:PageProps<'/notifications'>){
 const page=socialPage((await searchParams).page);if(page===null)notFound()
 const data=await getNotifications(page);if(!data)redirect('/login')
 return <><Navigation/><main id="main-content" className="mx-auto w-full max-w-[800px] space-y-6 px-4 pb-32 pt-24"><h1 className="text-2xl">Notificações</h1><NotificationControls/>{!data.items.length&&<p>Nenhuma notificação por enquanto.</p>}{data.items.map(n=><article key={n.id} className={`space-y-3 rounded-xl border border-border p-4 ${n.read?'opacity-70':'bg-surface-2'}`}>
 <p className="break-words">{n.kind==='moderation'?'Um conteúdo seu foi removido após análise da moderação.':<><Link href={publicProfilePath(n.username!)}>@{n.username}</Link> {n.kind==='follow'?'começou a seguir você.':n.kind==='reply'?'respondeu ao seu comentário.':'comentou na sua publicação.'}</>}</p>
 {n.post_id&&<Link className="inline-flex min-h-11 items-center" href={`/community/${n.post_id}`}>Abrir discussão</Link>}{n.read?<p className="text-xs text-muted-foreground">Lida</p>:<NotificationControls id={n.id}/>}
 </article>)}<nav aria-label="Paginação de notificações" className="flex justify-between">{page>1&&<Link href={`?page=${page-1}`}>Anterior</Link>}{page*30<data.total&&<Link href={`?page=${page+1}`}>Próxima</Link>}</nav></main></>
}
