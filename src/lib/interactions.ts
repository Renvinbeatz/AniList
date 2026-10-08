import {hasDiscriminatoryLanguage} from './community'
export type Comment = {id:string;parent_id:string|null;body:string;spoiler:boolean;created_at:string;username:string;display_name:string|null;avatar_preset:string|null;is_owner:boolean}
export type CommentPage = {items:Comment[];total:number;page:number}
export type Notification = {id:string;kind:'follow'|'comment'|'reply'|'moderation';username:string|null;post_id:string|null;read:boolean;created_at:string}
export type NotificationPage = {items:Notification[];total:number;page:number}
export type Report = {id:string;target_type:'post'|'comment';reason:string;detail:string|null;snapshot:{title?:string;body:string;image_url?:string|null};created_at:string}
export const REPORT_REASONS={harassment:'Assédio ou discriminação',spam:'Spam',spoiler:'Spoiler não sinalizado',image:'Imagem inadequada',other:'Outro motivo'} as const
export function validateComment(input:unknown):{data:{body:string;spoiler:boolean};error?:never}|{error:string;data?:never} {
 if(!input||typeof input!=='object'||Array.isArray(input))return {error:'Comentário inválido.'}
 const o=input as Record<string,unknown>
 if(Object.keys(o).some(k=>!['body','spoiler'].includes(k))||typeof o.body!=='string'||typeof o.spoiler!=='boolean')return {error:'Comentário inválido.'}
 const body=o.body.trim()
 if([...body].length<1||[...body].length>2000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(body))return {error:'Use um comentário de até 2.000 caracteres.'}
 if(hasDiscriminatoryLanguage(body))return {error:'O texto contém linguagem discriminatória bloqueada. Revise antes de publicar.'}
 return {data:{body,spoiler:o.spoiler}}
}
export function validReportReason(value:unknown):value is keyof typeof REPORT_REASONS{return typeof value==='string'&&Object.hasOwn(REPORT_REASONS,value)}
