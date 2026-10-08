import { platformHttpsUrl } from './platforms'

export type TopicInput = { title: string; body: string; image_url: string | null; spoiler: boolean }
export type Topic = TopicInput & { id: string; type: 'topic' | 'review'; created_at: string; updated_at: string; username: string; display_name: string | null; avatar_preset: string | null; is_owner: boolean; anime?: {id: string; title: string; anilist_id: number}; comment_count?: number }
export type Activity = {id: string; type:'activity'; created_at: string; username:string; display_name:string|null; avatar_preset:string|null; status:string; anime:{title:string; cover_image:string|null; anilist_id:number}}
export type Feed = {items:(Topic|Activity)[]; total:number; page:number}

// Conservative whole terms/phrases; basic evasion handling, not a semantic classifier.
const discriminatoryTerms = ['macaco preto', 'preto imundo', 'pretos imundos', 'negro imundo', 'negros imundos', 'negro inferior', 'negros inferiores', 'raça inferior', 'seu crioulo', 'crioulo imundo', 'preto lixo', 'negro lixo', 'sieg heil', 'heil hitler', 'viado', 'viada', 'viadinho', 'viadão', 'boiola', 'baitola', 'bicha imunda', 'traveco', 'sapatão']
export function moderationText(text: string) {
  return text.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase()
    .replace(/[\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g,'')
    .replace(/[013457@$]/g,c=>({'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','@':'a','$':'s'}[c]!))
}
export function hasDiscriminatoryLanguage(text: string) {
  const normalized=moderationText(text)
  return discriminatoryTerms.some(term=>{
    const letters=[...moderationText(term)].filter(c=>c!==' ')
    const pattern=letters.join('[\\s._*\\-]*')
    return new RegExp(`(^|[^a-z])${pattern}(?:s)?($|[^a-z])`,'u').test(normalized)
  })
}
export function validateTopic(input: unknown): {data:TopicInput; error?:never} | {error:string; data?:never} {
  if (!input || typeof input!=='object' || Array.isArray(input)) return {error:'Dados de publicação inválidos.'}
  const object=input as Record<string,unknown>
  if(Object.keys(object).some(k=>!['title','body','image_url','spoiler'].includes(k))) return {error:'Dados de publicação inválidos.'}
  if(typeof object.title!=='string'||typeof object.body!=='string'||typeof object.spoiler!=='boolean') return {error:'Preencha título e texto.'}
  const title=object.title.trim(),body=object.body.trim()
  if([...title].length<1||[...title].length>120||[...body].length<1||[...body].length>4000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(title+body)) return {error:'Use título de até 120 caracteres e texto de até 4.000 caracteres.'}
  if(hasDiscriminatoryLanguage(title+'\n'+body)) return {error:'O texto contém linguagem discriminatória bloqueada. Revise antes de publicar.'}
  let image:string|null=null
  if(object.image_url!==null&&object.image_url!==undefined&&object.image_url!=='') {
    if(typeof object.image_url!=='string'||!(image=platformHttpsUrl(object.image_url.trim()))) return {error:'Use um link HTTPS válido para a imagem.'}
  }
  return {data:{title,body,image_url:image,spoiler:object.spoiler}}
}
export function publicationError(error: string, wait?: number) {
  return error==='rate' ? `Aguarde ${wait ?? 60} segundos antes de publicar novamente.` : error==='missing' ? 'Publicação não encontrada ou sem permissão.' : 'Não foi possível salvar a publicação.'
}
