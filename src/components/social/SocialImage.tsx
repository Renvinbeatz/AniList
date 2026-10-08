'use client'
import {useState} from 'react'
import {platformHttpsUrl} from '@/lib/platforms'
export function SocialImage({src,alt,cover=false}:{src:string;alt:string;cover?:boolean}) {
 const [failed,setFailed]=useState(false)
 if(failed||!platformHttpsUrl(src)) return <p className="text-sm text-muted-foreground">Imagem indisponível.</p>
 // External publication images are not proxied or fetched by the server.
 // eslint-disable-next-line @next/next/no-img-element
 return <img src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(true)} className={cover?'h-20 w-14 shrink-0 rounded-lg object-cover':'max-h-[480px] w-full rounded-xl object-contain'} />
}
