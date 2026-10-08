import assert from 'node:assert/strict'
import {socialKit} from './helpers/social-live.mjs'
const k=await socialKit(['profile_follows','community_posts','social_publish_log','library_activity']);let count=0
async function check(name,fn){await fn();count++;console.log('PASS',name)}
try{
 const author=await k.user('Reviewer'),other=await k.user('Other'),{page}=await k.context(author),guest=await k.context()
 const anime=k.unwrap(await k.db.from('anime').select('id,anilist_id').eq('status','FINISHED').limit(1).single());let review
 await check('review starts with spoiler protection, publishes and appears on its anime',async()=>{
  await page.goto(`${k.base}/anime/${anime.anilist_id}/review`);assert.equal(await page.getByLabel('Contém spoilers',{exact:true}).isChecked(),true)
  await page.getByLabel('Título',{exact:true}).fill('Review '+k.prefix);await page.getByLabel('Texto',{exact:true}).fill('Minha opinião com spoilers da história.')
  await page.getByRole('button',{name:'Publicar review',exact:true}).click();await page.waitForURL(/\/community\/[a-f0-9-]+$/);review=new URL(page.url()).pathname.split('/').at(-1)
  assert.equal(await page.locator('details').evaluate(el=>el.open),false)
  await guest.page.goto(`${k.base}/anime/${anime.anilist_id}/reviews`);await guest.page.getByRole('heading',{name:'Review '+k.prefix,exact:true}).waitFor()
  assert.equal(await guest.page.locator('details').evaluate(el=>el.open),false)
 })
 await check('existing review redirects to edit; text and spoiler flag update without duplicate',async()=>{
  await page.goto(`${k.base}/anime/${anime.anilist_id}/review`);await page.waitForURL(`${k.base}/community/${review}/edit`)
  await page.getByLabel('Texto',{exact:true}).fill('Uma opinião atualizada, sem spoilers.');await page.getByLabel('Contém spoilers',{exact:true}).uncheck()
  await page.getByRole('button',{name:'Salvar alterações',exact:true}).click();await page.waitForURL(`${k.base}/community/${review}`)
  await page.getByText('Uma opinião atualizada, sem spoilers.',{exact:true}).waitFor()
  const args={p_actor:author.id,p_id:null,p_anime:anime.id,p_title:'duplicate',p_body:'duplicate',p_image:null,p_spoiler:false}
  assert.equal(k.unwrap(await k.db.rpc('social_save_review',args)).error,'duplicate')
  assert.equal(k.unwrap(await k.db.from('community_posts').select('id').eq('profile_id',author.id).eq('kind','review')).length,1)
 })
 await check('review cannot be edited by another owner, converted to a topic or bypass publication throttle',async()=>{
  assert.equal(k.unwrap(await k.db.rpc('social_save_review',{p_actor:other.id,p_id:review,p_anime:anime.id,p_title:'forged',p_body:'forged',p_image:null,p_spoiler:false})).error,'missing')
  assert.equal(k.unwrap(await k.db.rpc('social_save_post',{p_actor:author.id,p_id:review,p_title:'convert',p_body:'convert',p_image:null,p_spoiler:false})).error,'missing')
  assert.equal(k.unwrap(await k.db.rpc('social_save_post',{p_actor:author.id,p_id:null,p_title:'too soon',p_body:'too soon',p_image:null,p_spoiler:false})).error,'rate')
  k.unwrap(await k.db.from('profiles').update({profile_visibility:'private'}).eq('id',author.id));assert.equal(k.unwrap(await k.db.rpc('social_feed',{p_actor:null,p_anime:anime.id})).items.some(x=>x.id===review),false)
  k.unwrap(await k.db.from('profiles').update({profile_visibility:'public'}).eq('id',author.id))
 })
 await check('review edit is moderated; mobile editor and confirmed deletion work',async()=>{
  await page.goto(`${k.base}/community/${review}/edit`);await page.getByLabel('Texto',{exact:true}).fill('sieg heil')
  await page.getByRole('button',{name:'Salvar alterações',exact:true}).click();await page.getByRole('alert').getByText(/linguagem discriminatória/).waitFor()
  await page.setViewportSize({width:320,height:850});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
  await page.getByRole('button',{name:'Excluir review',exact:true}).click();await page.getByRole('button',{name:'Confirmar exclusão',exact:true}).click();await page.waitForURL(k.base+'/community')
  assert.equal(k.unwrap(await k.db.from('community_posts').select('id').eq('id',review).maybeSingle()),null)
 })
}finally{await k.cleanup()}
console.log(`${count} review browser checks passed; fixtures removed and original data preserved.`)
