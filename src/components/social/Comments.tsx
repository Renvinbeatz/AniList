'use client'
import {useState,useTransition} from 'react'
import Link from 'next/link'
import type {Comment} from '@/lib/interactions'
import {publicProfilePath} from '@/lib/public-profile'
import {deleteCommentAction} from '@/actions/interactions'
import {CommentEditor} from './CommentEditor'
import {ReportControl} from './ReportControl'
import {ProfileAvatar} from '@/components/profile/ProfileAvatar'
function CommentCard({comment,postId,signedIn,postSpoiler}:{comment:Comment;postId:string;signedIn:boolean;postSpoiler:boolean}) {
 const [mode,setMode]=useState<'none'|'edit'|'reply'|'delete'>('none'),[pending,start]=useTransition(),[error,setError]=useState<string|null>(null)
 return <article id={`comment-${comment.id}`} className={`min-w-0 space-y-3 rounded-xl border border-border p-4 ${comment.parent_id?'ml-3 sm:ml-8':''}`}>
 <Link href={publicProfilePath(comment.username)} className="flex min-w-0 items-center gap-3"><ProfileAvatar preset={comment.avatar_preset} className="h-8 w-8 shrink-0"/><span className="break-all text-sm">@{comment.username}</span></Link>
 {comment.parent_id&&<p className="text-xs text-muted-foreground">Resposta na discussão</p>}
 {postSpoiler||comment.spoiler?<details><summary className="min-h-11 cursor-pointer content-center text-sm text-muted-foreground">Mostrar comentário com spoilers</summary><p className="whitespace-pre-wrap break-words">{comment.body}</p></details>:<p className="whitespace-pre-wrap break-words">{comment.body}</p>}
 <div className="flex flex-wrap items-start gap-4">{signedIn&&!comment.parent_id&&<button className="min-h-11 text-sm" onClick={()=>setMode('reply')}>Responder</button>}{comment.is_owner?<><button className="min-h-11 text-sm" onClick={()=>setMode('edit')}>Editar comentário</button><button className="min-h-11 text-sm text-muted-foreground" onClick={()=>setMode('delete')}>Excluir comentário</button></>:signedIn&&<ReportControl type="comment" id={comment.id}/>}</div>
 {mode==='edit'&&<CommentEditor postId={postId} comment={comment} onDone={()=>setMode('none')}/>}{mode==='reply'&&<CommentEditor postId={postId} parentId={comment.id} spoilerDefault={postSpoiler} onDone={()=>setMode('none')}/>}
 {mode==='delete'&&<div className="space-y-2"><p className="text-sm">Excluir este comentário e suas respostas?</p><button disabled={pending} className="min-h-11 pr-4 text-destructive" onClick={()=>start(async()=>{try{const result=await deleteCommentAction(comment.id);if(result.error)setError(result.error);else setMode('none')}catch{setError('Não foi possível excluir.')}})}>Confirmar exclusão do comentário</button><button disabled={pending} className="min-h-11" onClick={()=>setMode('none')}>Cancelar exclusão do comentário</button></div>}
 {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
 </article>
}
export function Comments({items,postId,signedIn,postSpoiler,visibility}:{items:Comment[];postId:string;signedIn:boolean;postSpoiler:boolean;visibility?:string}) {
 return <section aria-label="Discussão" className="space-y-4"><h2 className="text-xl">Discussão</h2>
 {signedIn&&visibility==='private'&&<p className="text-sm text-muted-foreground">Seu perfil está privado: seus comentários ficarão visíveis somente para você.</p>}
 {signedIn?<CommentEditor postId={postId} spoilerDefault={postSpoiler}/>:<Link className="min-h-11 inline-flex items-center" href="/login">Entre para comentar</Link>}
 {!items.length&&<p className="text-muted-foreground">Seja a primeira pessoa a comentar.</p>}{items.map(comment=><CommentCard key={comment.id} comment={comment} postId={postId} signedIn={signedIn} postSpoiler={postSpoiler}/>)}
 </section>
}
