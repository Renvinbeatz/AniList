import assert from 'node:assert/strict'
import { socialKit } from './helpers/social-live.mjs'
const k = await socialKit(['profile_follows'])
let count = 0
async function check(name,fn) { await fn(); count++; console.log('PASS',name) }
try {
  const a = await k.user('A'), b = await k.user('B'), hidden = await k.user('Private','private')
  const {page,ctx} = await k.context(a), visitor = await k.context()
  let action
  page.on('request',r=>{if(r.method()==='POST'&&r.headers()['next-action']) action=r.headers()['next-action']})
  await check('search is literal, public-only and contains no account identifiers',async()=>{
    await page.goto(`${k.base}/people?q=${k.prefix}`)
    assert.equal(await page.getByText('@'+hidden.username,{exact:true}).count(),0)
    await page.getByText('@'+b.username,{exact:true}).waitFor()
    const dto = k.unwrap(await k.db.rpc('social_people',{p_actor:a.id,p_query:k.prefix}))
    assert.equal(dto.items.length,2); assert.equal(JSON.stringify(dto).includes(a.id),false)
    assert.equal(k.unwrap(await k.db.rpc('social_people',{p_actor:a.id,p_query:'%'})).items.length,0)
  })
  await check('follow, reload, list followers and unfollow work through the UI',async()=>{
    await page.goto(`${k.base}/user/${b.username}`)
    await page.getByRole('button',{name:'Seguir',exact:true}).click()
    await page.getByRole('button',{name:'Deixar de seguir',exact:true}).waitFor()
    await page.reload(); await page.getByRole('button',{name:'Deixar de seguir',exact:true}).waitFor()
    await page.goto(`${k.base}/user/${b.username}/connections`); await page.getByText('@'+a.username,{exact:true}).waitFor()
    await page.goto(`${k.base}/user/${a.username}/connections?type=following`); await page.getByText('@'+b.username,{exact:true}).waitFor()
    await page.getByRole('button',{name:'Deixar de seguir',exact:true}).click(); await page.getByText('Nenhuma pessoa encontrada.',{exact:true}).waitFor()
    assert.equal(k.unwrap(await k.db.from('profile_follows').select('*').eq('follower_id',a.id)).length,0)
  })
  await check('self, private target, anonymous and direct client calls are refused',async()=>{
    assert.equal(k.unwrap(await k.db.rpc('social_follow',{p_actor:a.id,p_username:a.username,p_selected:true})),false)
    assert.equal(k.unwrap(await k.db.rpc('social_follow',{p_actor:a.id,p_username:hidden.username,p_selected:true})),false)
    assert.equal((await k.anon.rpc('social_people',{p_actor:a.id})).error.code,'42501')
    assert.equal((await k.anon.from('profile_follows').select('*')).error.code,'42501')
    const response = await visitor.ctx.request.post(k.base+'/people',{headers:{'next-action':action,origin:k.base,'content-type':'text/plain;charset=UTF-8'},data:JSON.stringify([b.username,true])})
    assert.ok((await response.text()).includes('Entre na sua conta'))
    assert.equal(k.unwrap(await k.db.rpc('social_people',{p_actor:null,p_username:hidden.username,p_mode:'followers'})),null)
    assert.ok(k.unwrap(await k.db.rpc('social_people',{p_actor:hidden.id,p_username:hidden.username,p_mode:'following'})))
    await ctx.request.get(k.base+'/people')
  })
  await check('mobile people layout has no horizontal overflow',async()=>{
    await page.setViewportSize({width:320,height:850}); await page.goto(`${k.base}/people?q=${k.prefix}`)
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
  })
} finally { await k.cleanup() }
console.log(`${count} following browser checks passed; fixtures removed and original data preserved.`)
