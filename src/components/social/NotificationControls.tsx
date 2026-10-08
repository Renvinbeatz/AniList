'use client'
import {useState,useTransition} from 'react'
import {notificationReadAction} from '@/actions/interactions'
export function NotificationControls({id}:{id?:string}) {
 const [pending,start]=useTransition(),[error,setError]=useState<string|null>(null)
 return <div><button disabled={pending} className="min-h-11 text-sm" onClick={()=>start(async()=>{try{setError((await notificationReadAction(id)).error)}catch{setError('Não foi possível marcar como lida.')}})}>{pending?'Salvando…':id?'Marcar como lida':'Marcar todas como lidas'}</button>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}</div>
}
