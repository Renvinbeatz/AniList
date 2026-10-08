'use client'
import {useState,useTransition,useId} from 'react'
import {saveCommentAction} from '@/actions/interactions'
import type {Comment} from '@/lib/interactions'
export function CommentEditor({postId,parentId,comment,spoilerDefault=false,onDone}:{postId:string;parentId?:string;comment?:Comment;spoilerDefault?:boolean;onDone?:()=>void}) {
 const [body,setBody]=useState(comment?.body??''),[spoiler,setSpoiler]=useState(comment?.spoiler??spoilerDefault),[error,setError]=useState<string|null>(null),[pending,start]=useTransition(),field=useId()
 return <form className="space-y-3 rounded-xl border border-border p-4" onSubmit={e=>{e.preventDefault();start(async()=>{setError(null);try{const result=await saveCommentAction(postId,{body,spoiler},comment?.id,parentId);if(result.error)setError(result.error);else{setBody('');onDone?.()}}catch{setError('Não foi possível confirmar o comentário. Tente novamente.')}})}}>
 <label htmlFor={field} className="block font-medium">{comment?'Editar comentário':parentId?'Sua resposta':'Seu comentário'}</label><textarea id={field} required disabled={pending} rows={3} value={body} onChange={e=>setBody(e.target.value)} className="w-full rounded-xl border border-border bg-background p-3"/>
 <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={spoiler} disabled={pending} onChange={e=>setSpoiler(e.target.checked)}/>Comentário contém spoilers</label>
 {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
 <div className="flex flex-wrap gap-4"><button disabled={pending} className="min-h-11 rounded-full border border-border px-4">{pending?'Salvando…':comment?'Salvar comentário':parentId?'Publicar resposta':'Publicar comentário'}</button>{onDone&&<button type="button" disabled={pending} className="min-h-11" onClick={onDone}>Cancelar comentário</button>}</div>
 </form>
}
