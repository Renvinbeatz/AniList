'use server'
import {getSession} from '@/lib/session'
import {supabaseServerClient} from '@/data/supabase'
import {validateTopic,publicationError} from '@/lib/community'
import {isPlatformId} from '@/lib/platforms'
import {revalidatePath} from 'next/cache'

export async function saveTopicAction(input:unknown, id?:string) {
  const session=await getSession()
  if(!session) return {error:'Entre na sua conta para publicar.'}
  const parsed=validateTopic(input)
  if(!parsed.data) return {error:parsed.error}
  if(id!==undefined&&!isPlatformId(id)) return {error:'Publicação inválida.'}
  const {data,error}=await supabaseServerClient.rpc('social_save_post',{p_actor:session.profileId,p_id:id??null,p_title:parsed.data.title,p_body:parsed.data.body,p_image:parsed.data.image_url,p_spoiler:parsed.data.spoiler})
  const result=data as {id?:string;error?:string;wait?:number}|null
  if(error||!result?.id) return {error:publicationError(result?.error??'',result?.wait)}
  revalidatePath('/community','layout')
  return {error:null,id:result.id}
}
export async function deleteTopicAction(id:string) {
  const session=await getSession()
  if(!session) return {error:'Entre na sua conta para publicar.'}
  if(!isPlatformId(id)) return {error:'Publicação inválida.'}
  const {data,error}=await supabaseServerClient.from('community_posts').delete().eq('id',id).eq('profile_id',session.profileId).select('id').maybeSingle()
  if(error||!data) return {error:'Publicação não encontrada ou sem permissão.'}
  revalidatePath('/community','layout')
  revalidatePath('/anime','layout')
  return {error:null}
}
export async function activitySettingAction(enabled:boolean) {
  const session=await getSession()
  if(!session) return {error:'Entre na sua conta.'}
  if(typeof enabled!=='boolean') return {error:'Configuração inválida.'}
  const {data,error}=await supabaseServerClient.rpc('social_activity_setting',{p_actor:session.profileId,p_enabled:enabled})
  if(error||!data) return {error:'Não foi possível salvar a configuração.'}
  revalidatePath('/community','layout')
  return {error:null}
}
