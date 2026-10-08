'use client'
import {useTransition,useState} from 'react'
import {activitySettingAction} from '@/actions/community'
export function ActivitySetting({enabled,visibility}:{enabled:boolean;visibility:string}) {
 const [pending,start]=useTransition(),[message,setMessage]=useState<string|null>(null)
 return <section className="space-y-3 rounded-2xl border border-border p-4"><h2 className="font-medium">Atividades da biblioteca</h2>
 <p className="text-sm text-muted-foreground">Compartilhar apenas os animes e mudanças de status. Progresso, notas e plataformas ficam privados. Desativar também remove suas atividades anteriores.</p>
 {visibility==='private'&&<p className="text-sm text-muted-foreground">Seu perfil está privado; suas atividades não serão publicadas.</p>}
 <button disabled={pending} aria-pressed={enabled} className="min-h-11 rounded-full border border-border px-4" onClick={()=>start(async()=>{try{const result=await activitySettingAction(!enabled);setMessage(result.error??'Preferência salva.')}catch{setMessage('Não foi possível salvar.')}})}>{pending?'Salvando…':enabled?'Desativar compartilhamento':'Ativar compartilhamento'}</button>
 {message&&<p role="status" className="text-sm">{message}</p>}</section>
}
