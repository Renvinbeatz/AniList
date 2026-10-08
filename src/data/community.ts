import 'server-only'
import {supabaseServerClient} from './supabase'
import {getSession} from '@/lib/session'
import type {Feed} from '@/lib/community'

export async function getFeed(mode:'all'|'following',page:number,id:string|null=null,animeId:string|null=null):Promise<Feed> {
  const session=await getSession()
  const {data,error}=await supabaseServerClient.rpc('social_feed',{p_actor:session?.profileId??null,p_mode:mode,p_page:page,p_id:id,p_anime:animeId})
  if(error||!data) throw new Error('Não foi possível carregar a comunidade agora.')
  return data as unknown as Feed
}
export async function getActivitySetting() {
  const session=await getSession()
  if(!session) return null
  const {data,error}=await supabaseServerClient.from('profiles').select('share_library_activity,profile_visibility').eq('id',session.profileId).single()
  if(error) throw new Error('Não foi possível carregar sua configuração.')
  return data
}
