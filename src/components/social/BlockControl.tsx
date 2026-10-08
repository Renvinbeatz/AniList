'use client'
import {useState,useTransition} from 'react'
import {useRouter} from 'next/navigation'
import {blockAction} from '@/actions/interactions'
export function BlockControl({username,blocked=false}:{username:string;blocked?:boolean}) {
 const [confirm,setConfirm]=useState(false),[pending,start]=useTransition(),[error,setError]=useState<string|null>(null),router=useRouter()
 return <div className="space-y-2">{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
 {!confirm?<button className="min-h-11 text-sm text-muted-foreground" onClick={()=>setConfirm(true)}>{blocked?'Desbloquear':'Bloquear pessoa'}</button>:<div className="space-y-2"><p className="text-sm">{blocked?'Desbloquear esta pessoa? As relações anteriores não serão restauradas.':'Bloquear esta pessoa? As relações de seguir serão removidas, e vocês deixarão de interagir enquanto estiverem conectados às contas.'}</p>
 <div className="flex flex-wrap gap-4"><button disabled={pending} className="min-h-11 text-destructive" onClick={()=>start(async()=>{try{const result=await blockAction(username,!blocked);if(result.error)setError(result.error);else{setConfirm(false);router.push('/community/blocked')}}catch{setError('Não foi possível confirmar o bloqueio.')}})}>{pending?'Salvando…':blocked?'Confirmar desbloqueio':'Confirmar bloqueio'}</button><button className="min-h-11" disabled={pending} onClick={()=>setConfirm(false)}>Cancelar bloqueio</button></div></div>}</div>
}
