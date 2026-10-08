'use client'
import {useState,useTransition} from 'react'
import {resolveReportAction} from '@/actions/interactions'
export function ModerationControl({id}:{id:string}) {
 const [remove,setRemove]=useState(false),[pending,start]=useTransition(),[error,setError]=useState<string|null>(null)
 function resolve(deleting:boolean){start(async()=>{try{setError((await resolveReportAction(id,deleting)).error)}catch{setError('Não foi possível concluir a análise.')}})}
 return <div className="space-y-3">{error&&<p role="alert">{error}</p>}<div className="flex flex-wrap gap-4"><button disabled={pending} className="min-h-11" onClick={()=>resolve(false)}>Encerrar sem remover</button><button disabled={pending} className="min-h-11 text-destructive" onClick={()=>setRemove(true)}>Remover conteúdo</button></div>{remove&&<div><p>Remover o conteúdo e suas respostas definitivamente?</p><button className="min-h-11 pr-4 text-destructive" disabled={pending} onClick={()=>resolve(true)}>Confirmar remoção</button><button className="min-h-11" disabled={pending} onClick={()=>setRemove(false)}>Cancelar remoção</button></div>}</div>
}
