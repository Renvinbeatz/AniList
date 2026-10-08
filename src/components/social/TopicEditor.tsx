'use client'
import {useState,useTransition} from 'react'
import {useRouter} from 'next/navigation'
import {saveTopicAction,deleteTopicAction} from '@/actions/community'
import {saveReviewAction} from '@/actions/reviews'
import type {Topic} from '@/lib/community'

export function TopicEditor({topic,anime,visibility}:{topic?:Topic;anime?:{id:string;title:string};visibility?:string}) {
  const review=topic?.type==='review'||!!anime,reviewAnime=anime??topic?.anime
  const [title,setTitle]=useState(topic?.title??''),[body,setBody]=useState(topic?.body??''),[image,setImage]=useState(topic?.image_url??''),[spoiler,setSpoiler]=useState(topic?.spoiler??review)
  const [error,setError]=useState<string|null>(null),[confirm,setConfirm]=useState(false),[pending,start]=useTransition(),router=useRouter()
  return <section className="space-y-4 rounded-2xl border border-border bg-surface-1 p-4">
    <h2 className="text-lg font-medium">{review?(topic?'Editar review':'Escrever review'):(topic?'Editar tópico':'Criar tópico')}</h2>
    {reviewAnime&&<p className="text-sm text-muted-foreground">{reviewAnime.title}</p>}
    <form className="space-y-4" onSubmit={e=>{e.preventDefault();start(async()=>{setError(null);try {
      const input={title,body,image_url:image,spoiler}
      const result=review&&reviewAnime?await saveReviewAction(reviewAnime.id,input,topic?.id):await saveTopicAction(input,topic?.id)
      if(result.error) setError(result.error); else router.push(`/community/${result.id}`)
    } catch {setError('Não foi possível confirmar. Tente novamente.')} })}}>
      <div className="space-y-2"><label htmlFor="topic-title" className="block">Título</label><input id="topic-title" required value={title} onChange={e=>setTitle(e.target.value)} disabled={pending} className="min-h-11 w-full rounded-xl border border-border bg-background px-3" /></div>
      <div className="space-y-2"><label htmlFor="topic-body" className="block">Texto</label><textarea id="topic-body" required rows={6} value={body} onChange={e=>setBody(e.target.value)} disabled={pending} className="w-full rounded-xl border border-border bg-background p-3" /></div>
      <div className="space-y-2"><label htmlFor="topic-image" className="block">Imagem HTTPS (opcional)</label><input id="topic-image" type="url" value={image} onChange={e=>setImage(e.target.value)} disabled={pending} className="min-h-11 w-full rounded-xl border border-border bg-background px-3" /></div>
      <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={spoiler} onChange={e=>setSpoiler(e.target.checked)} disabled={pending} />Contém spoilers</label>
      <p className="text-sm text-muted-foreground">A publicação acompanha a visibilidade do seu perfil. Use imagens que você tem permissão para compartilhar.</p>
      {visibility==='private'&&<p className="text-sm text-muted-foreground">Seu perfil está privado: esta publicação ficará visível somente para você. Você pode alterar isso nas configurações do perfil.</p>}
      {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-3"><button disabled={pending} className="min-h-11 rounded-full bg-foreground px-5 text-background disabled:opacity-50">{pending?'Salvando…':topic?'Salvar alterações':review?'Publicar review':'Publicar tópico'}</button><button type="button" disabled={pending} className="min-h-11 px-4" onClick={()=>router.push(topic?`/community/${topic.id}`:'/community')}>Cancelar</button></div>
    </form>
    {topic&&<div>{!confirm?<button disabled={pending} className="min-h-11 text-destructive" onClick={()=>setConfirm(true)}>{review?'Excluir review':'Excluir tópico'}</button>:<div className="space-y-3"><p>Excluir esta publicação definitivamente?</p><button disabled={pending} className="min-h-11 pr-4 text-destructive" onClick={()=>start(async()=>{try{const result=await deleteTopicAction(topic.id);if(result.error)setError(result.error);else router.push('/community')}catch{setError('Não foi possível excluir.')}})}>Confirmar exclusão</button><button disabled={pending} className="min-h-11" onClick={()=>setConfirm(false)}>Cancelar exclusão</button></div>}</div>}
  </section>
}
