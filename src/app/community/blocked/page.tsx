import {redirect} from 'next/navigation'
import {getBlocked} from '@/data/interactions'
import {Navigation} from '@/components/Navigation'
import {BlockControl} from '@/components/social/BlockControl'
export default async function BlockedPage(){
 const people=await getBlocked();if(!people)redirect('/login')
 return <><Navigation/><main id="main-content" className="mx-auto w-full max-w-[800px] space-y-6 px-4 pb-32 pt-24"><h1 className="text-2xl">Pessoas bloqueadas</h1>{!people.length&&<p>Nenhuma pessoa bloqueada.</p>}{people.map(p=><section key={p.username} className="space-y-2 rounded-xl border border-border p-4"><p className="break-all">@{p.username}</p><BlockControl username={p.username} blocked/></section>)}</main></>
}
