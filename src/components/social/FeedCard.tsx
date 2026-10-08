import Link from 'next/link'
import {ProfileAvatar} from '@/components/profile/ProfileAvatar'
import {publicProfilePath} from '@/lib/public-profile'
import {STATUS_LABELS} from '@/lib/constants'
import type {Topic,Activity} from '@/lib/community'
import {SocialImage} from './SocialImage'
import {ReportControl} from './ReportControl'

export function FeedCard({item,detail=false}:{item:Topic|Activity;detail?:boolean}) {
 const date=new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(new Date(item.created_at))
 return <article className="min-w-0 space-y-4 rounded-2xl border border-border bg-surface-1/40 p-4 sm:p-6">
  <div className="flex flex-wrap items-center justify-between gap-3"><Link href={publicProfilePath(item.username)} className="flex min-w-0 items-center gap-3"><ProfileAvatar preset={item.avatar_preset} className="h-10 w-10 shrink-0"/><span className="break-all">{item.display_name||item.username}<span className="block text-xs text-muted-foreground">@{item.username}</span></span></Link><time dateTime={item.created_at} className="text-xs text-muted-foreground">{date}</time></div>
  {item.type==='activity'?<Link href={`/anime/${item.anime.anilist_id}`} className="flex items-center gap-4">{item.anime.cover_image&&<SocialImage src={item.anime.cover_image} alt="" cover/>}<div className="min-w-0 break-words"><p>{item.anime.title}</p><p className="text-sm text-muted-foreground">{STATUS_LABELS[item.status as keyof typeof STATUS_LABELS]||item.status}</p></div></Link>:<>
   {item.type==='review'&&item.anime&&<p className="text-sm text-muted-foreground">Review · <Link href={`/anime/${item.anime.anilist_id}`}>{item.anime.title}</Link></p>}
   <h2 className="break-words text-xl font-medium">{detail?item.title:<Link href={`/community/${item.id}`}>{item.title}</Link>}</h2>
   {item.spoiler?<details className="space-y-3"><summary className="min-h-11 cursor-pointer content-center text-muted-foreground">Mostrar conteúdo com spoilers</summary><div className="space-y-4"><p className="whitespace-pre-wrap break-words">{item.body}</p>{item.image_url&&<SocialImage src={item.image_url} alt="Imagem da publicação"/>}</div></details>:<><p className="whitespace-pre-wrap break-words">{item.body}</p>{item.image_url&&<SocialImage src={item.image_url} alt="Imagem da publicação"/>}</>}
   <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">{!detail&&<Link className="min-h-11 content-center" href={`/community/${item.id}`}>Abrir discussão · {item.comment_count??0} {item.comment_count===1?'comentário':'comentários'}</Link>}{item.is_owner?<Link className="min-h-11 content-center" href={`/community/${item.id}/edit`}>Editar</Link>:<ReportControl type="post" id={item.id}/>}</div>
  </>}
 </article>
}
