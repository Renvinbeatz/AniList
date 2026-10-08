import 'server-only'
import {getSession} from '@/lib/session'
import {supabaseServerClient} from './supabase'
import type {CommentPage,NotificationPage,Report} from '@/lib/interactions'
export async function getComments(postId:string,page:number):Promise<CommentPage|null> {
 const session=await getSession(),{data,error}=await supabaseServerClient.rpc('social_comments',{p_actor:session?.profileId??null,p_post:postId,p_page:page})
 if(error)throw new Error('Não foi possível carregar os comentários.')
 return data as unknown as CommentPage|null
}
export async function getNotifications(page:number):Promise<NotificationPage|null> {
 const session=await getSession();if(!session)return null
 const {data,error}=await supabaseServerClient.rpc('social_notification_list',{p_actor:session.profileId,p_page:page})
 if(error)throw new Error('Não foi possível carregar as notificações.')
 return data as unknown as NotificationPage|null
}
export async function getBlocked() {
 const session=await getSession();if(!session)return null
 const {data,error}=await supabaseServerClient.rpc('social_blocked_list',{p_actor:session.profileId})
 if(error)throw new Error('Não foi possível carregar os bloqueios.')
 return data as {username:string}[]|null
}
export async function getModerationQueue(page:number) {
 const session=await getSession();if(!session)return null
 const {data,error}=await supabaseServerClient.rpc('social_moderation_queue',{p_actor:session.profileId,p_page:page})
 if(error)throw new Error('Não foi possível carregar as denúncias.')
 return data as unknown as {items:Report[];total:number;page:number}|null
}
