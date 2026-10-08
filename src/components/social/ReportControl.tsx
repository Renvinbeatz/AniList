'use client'
import {useState,useTransition,useId} from 'react'
import {reportAction} from '@/actions/interactions'
import {REPORT_REASONS} from '@/lib/interactions'
export function ReportControl({type,id}:{type:'post'|'comment';id:string}) {
 const [open,setOpen]=useState(false),[reason,setReason]=useState('harassment'),[detail,setDetail]=useState(''),[message,setMessage]=useState<string|null>(null),[pending,start]=useTransition(),field=useId()
 return <div className="space-y-3">{message&&<p role="status" className="text-sm">{message}</p>}
 {!open?<button className="min-h-11 text-sm text-muted-foreground" onClick={()=>{setMessage(null);setOpen(true)}}>Denunciar</button>:<form className="space-y-3 rounded-xl border border-border p-3" onSubmit={e=>{e.preventDefault();start(async()=>{try{const result=await reportAction(type,id,reason,detail);setMessage(result.error??'Denúncia enviada para análise.');if(!result.error)setOpen(false)}catch{setMessage('Não foi possível enviar. Tente novamente.')}})}}>
 <label htmlFor={field} className="block text-sm">Motivo da denúncia</label><select id={field} disabled={pending} value={reason} onChange={e=>setReason(e.target.value)} className="min-h-11 w-full rounded-lg border border-border bg-background p-2">{Object.entries(REPORT_REASONS).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
 <label htmlFor={`${field}-detail`} className="block text-sm">Detalhes (opcional)</label><textarea id={`${field}-detail`} disabled={pending} value={detail} onChange={e=>setDetail(e.target.value)} maxLength={500} className="w-full rounded-lg border border-border bg-background p-2"/>
 <p className="text-xs text-muted-foreground">A denúncia é privada e será revisada. Ela não remove automaticamente o conteúdo.</p>
 <div className="flex flex-wrap gap-4"><button disabled={pending} className="min-h-11">{pending?'Enviando…':'Enviar denúncia'}</button><button type="button" disabled={pending} className="min-h-11" onClick={()=>setOpen(false)}>Cancelar denúncia</button></div>
 </form>}</div>
}
