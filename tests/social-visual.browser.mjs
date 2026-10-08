import assert from 'node:assert/strict'
import {mkdirSync} from 'node:fs'
import {socialKit} from './helpers/social-live.mjs'
const k=await socialKit([])
try{
 const author=await k.user('Visual'),other=await k.user('Friend')
 k.unwrap(await k.db.from('profiles').update({display_name:'Luna',avatar_preset:'happy-lavender'}).eq('id',author.id))
 k.unwrap(await k.db.from('profiles').update({display_name:'Kai',avatar_preset:'laughing-peach'}).eq('id',other.id))
 const post=k.unwrap(await k.db.from('community_posts').insert({profile_id:author.id,title:'Qual anime ficou com você depois do final?',body:'Tem histórias que continuam com a gente mesmo depois do último episódio.\n\nQual foi a sua? Quero descobrir algo novo para a minha lista.'}).select('id').single())
 k.unwrap(await k.db.from('community_comments').insert({profile_id:other.id,post_id:post.id,body:'Gosto das histórias que fazem uma coisa simples parecer especial. Os personagens continuam na memória.',spoiler:false}))
 const {page}=await k.context(author)
 mkdirSync('test-results/v4-social',{recursive:true})
 await page.goto(k.base+'/community');await page.getByRole('heading',{name:'Qual anime ficou com você depois do final?',exact:true}).waitFor()
 await page.screenshot({path:'test-results/v4-social/desktop.png'})
 for(const width of [320,390,768,1024,1280]){
  await page.setViewportSize({width,height:900});await page.goto(`${k.base}/community/${post.id}`)
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
  if(width===390)await page.screenshot({path:'test-results/v4-social/mobile.png'})
 }
 await page.setViewportSize({width:768,height:900});await page.goto(k.base+'/profile');await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight))
 const logout=await page.getByRole('button',{name:'Sair da conta',exact:true}).boundingBox()
 const nav=await page.getByRole('navigation',{name:'Navegação Principal Mobile',exact:true}).boundingBox()
 assert.ok(logout.y+logout.height<=nav.y,'Tablet footer overlaps navigation')
}finally{await k.cleanup()}
console.log('Social visual and tablet layout checks passed; fixtures removed and original records preserved.')
