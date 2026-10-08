import {notFound} from 'next/navigation'
import {getModerationQueue} from '@/data/interactions'
import {socialPage} from '@/lib/social'
import {REPORT_REASONS} from '@/lib/interactions'
import {Navigation} from '@/components/Navigation'
import {ModerationControl} from '@/components/social/ModerationControl'
import {SocialImage} from '@/components/social/SocialImage'
import Link from 'next/link'
export default async function ModerationPage({searchParams}:PageProps<'/moderation'>){
 const page=socialPage((await searchParams).page);if(page===null)notFound()
 const data=await getModerationQueue(page);if(!data)notFound()
 return <><Navigation/><main id="main-content" className="mx-auto w-full max-w-[800px] space-y-6 px-4 pb-32 pt-24"><h1 className="text-2xl">Analisar denúncias</h1><p className="text-muted-foreground">Revise o contexto antes de decidir. O registro abaixo é uma cópia do conteúdo no momento da denúncia.</p>{!data.items.length&&<p>Nenhuma denúncia pendente.</p>}{data.items.map(r=><article key={r.id} className="space-y-4 rounded-xl border border-border p-4"><p className="font-medium">{REPORT_REASONS[r.reason as keyof typeof REPORT_REASONS]||r.reason}</p>{r.detail&&<p className="whitespace-pre-wrap break-words text-sm">{r.detail}</p>}{r.snapshot.title&&<h2 className="break-words text-xl">{r.snapshot.title}</h2>}<p className="whitespace-pre-wrap break-words">{r.snapshot.body}</p>{r.snapshot.image_url&&<SocialImage src={r.snapshot.image_url} alt="Imagem denunciada"/>}<ModerationControl id={r.id}/></article>)}<nav className="flex justify-between" aria-label="Paginação de denúncias">{page>1&&<Link href={`?page=${page-1}`}>Anterior</Link>}{page*20<data.total&&<Link href={`?page=${page+1}`}>Próxima</Link>}</nav></main></>
}
