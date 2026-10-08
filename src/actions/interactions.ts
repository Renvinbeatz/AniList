'use server'
import {getSession} from '@/lib/session'
import {supabaseServerClient} from '@/data/supabase'
import {isPlatformId} from '@/lib/platforms'
import {validPublicUsername} from '@/lib/public-profile'
import {validateComment,validReportReason} from '@/lib/interactions'
import {publicationError} from '@/lib/community'
import {revalidatePath} from 'next/cache'

export async function saveCommentAction(postId:string,input:unknown,id?:string,parentId?:string) {
 const session=await getSession();if(!session)return {error:'Entre na sua conta para comentar.'}
 if(!isPlatformId(postId)||(id!==undefined&&!isPlatformId(id))||(parentId!==undefined&&!isPlatformId(parentId)))return {error:'Comentário inválido.'}
 const parsed=validateComment(input);if(!parsed.data)return {error:parsed.error}
 const {data,error}=await supabaseServerClient.rpc('social_save_comment',{p_actor:session.profileId,p_post:postId,p_id:id??null,p_parent:parentId??null,p_body:parsed.data.body,p_spoiler:parsed.data.spoiler})
 const result=data as {id?:string;error?:string;wait?:number}|null
 if(error||!result?.id)return {error:publicationError(result?.error??'',result?.wait)}
 revalidatePath('/community','layout');revalidatePath('/notifications')
 return {error:null}
}
export async function deleteCommentAction(id:string) {
 const session=await getSession();if(!session)return {error:'Entre na sua conta para comentar.'}
 if(!isPlatformId(id))return {error:'Comentário inválido.'}
 const {data,error}=await supabaseServerClient.from('community_comments').delete().eq('id',id).eq('profile_id',session.profileId).select('id').maybeSingle()
 if(error||!data)return {error:'Comentário não encontrado ou sem permissão.'}
 revalidatePath('/community','layout');revalidatePath('/notifications')
 return {error:null}
}
export async function blockAction(username:string,selected:boolean) {
 const session=await getSession();if(!session)return {error:'Entre na sua conta.'}
 if(!validPublicUsername(username)||typeof selected!=='boolean')return {error:'Dados inválidos.'}
 const {data,error}=await supabaseServerClient.rpc('social_block',{p_actor:session.profileId,p_username:username,p_selected:selected})
 if(error||!data)return {error:'Não foi possível alterar o bloqueio.'}
 revalidatePath('/user','layout');revalidatePath('/community','layout');revalidatePath('/people');revalidatePath('/notifications');revalidatePath('/profile')
 return {error:null}
}
export async function notificationReadAction(id?:string) {
 const session=await getSession();if(!session)return {error:'Entre na sua conta.'}
 if(id!==undefined&&!isPlatformId(id))return {error:'Notificação inválida.'}
 let query=supabaseServerClient.from('social_notifications').update({read_at:new Date().toISOString()}).eq('recipient_id',session.profileId)
 if(id)query=query.eq('id',id)
 const {error}=await query
 if(error)return {error:'Não foi possível marcar como lida.'}
 revalidatePath('/notifications');return {error:null}
}
export async function reportAction(type:'post'|'comment',id:string,reason:string,detail:string) {
 const session=await getSession();if(!session)return {error:'Entre na sua conta para denunciar.'}
 if(!['post','comment'].includes(type)||!isPlatformId(id)||!validReportReason(reason)||typeof detail!=='string'||[...detail].length>500||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(detail))return {error:'Denúncia inválida.'}
 const {data,error}=await supabaseServerClient.rpc('social_report',{p_actor:session.profileId,p_target_type:type,p_target:id,p_reason:reason,p_detail:detail.trim()||null})
 const result=data as {id?:string;error?:string;wait?:number}|null
 if(error||!result?.id)return {error:result?.error==='duplicate'?'Você já denunciou este conteúdo.':publicationError(result?.error??'',result?.wait)}
 revalidatePath('/moderation');return {error:null}
}
export async function resolveReportAction(id:string,remove:boolean) {
 const session=await getSession();if(!session)return {error:'Entre na sua conta.'}
 if(!isPlatformId(id)||typeof remove!=='boolean')return {error:'Dados inválidos.'}
 const {data,error}=await supabaseServerClient.rpc('social_resolve_report',{p_actor:session.profileId,p_id:id,p_remove:remove})
 if(error||!data)return {error:'Denúncia indisponível ou sem permissão.'}
 revalidatePath('/moderation');revalidatePath('/community','layout');revalidatePath('/anime','layout');revalidatePath('/notifications')
 return {error:null}
}
