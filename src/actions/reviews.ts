'use server'
import {getSession} from '@/lib/session'
import {supabaseServerClient} from '@/data/supabase'
import {validateTopic,publicationError} from '@/lib/community'
import {isPlatformId} from '@/lib/platforms'
import {revalidatePath} from 'next/cache'
export async function saveReviewAction(animeId:string,input:unknown,id?:string) {
 const session=await getSession()
 if(!session)return {error:'Entre na sua conta para publicar.'}
 if(!isPlatformId(animeId)||(id!==undefined&&!isPlatformId(id)))return {error:'Review inválida.'}
 const parsed=validateTopic(input);if(!parsed.data)return {error:parsed.error}
 const {data,error}=await supabaseServerClient.rpc('social_save_review',{p_actor:session.profileId,p_id:id??null,p_anime:animeId,p_title:parsed.data.title,p_body:parsed.data.body,p_image:parsed.data.image_url,p_spoiler:parsed.data.spoiler})
 const result=data as {id?:string;error?:string;wait?:number}|null
 if(error||!result?.id)return {error:result?.error==='duplicate'?'Você já publicou uma review deste anime. Edite a existente.':publicationError(result?.error??'',result?.wait)}
 revalidatePath('/community','layout');revalidatePath('/anime','layout')
 return {error:null,id:result.id}
}
