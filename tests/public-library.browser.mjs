import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { randomBytes, randomUUID, createHash } from 'node:crypto'
import { existsSync, mkdirSync } from 'node:fs'
import { setTimeout as delay } from 'node:timers/promises'
import { createClient } from '@supabase/supabase-js'

if (!process.argv.includes('--live')) throw new Error('Use --live for isolated official-project browser tests.')
if (existsSync('.env.local')) process.loadEnvFile('.env.local')
if (existsSync('.env')) process.loadEnvFile('.env')
if (new URL(process.env.SUPABASE_URL).hostname !== 'hhprevdkcvqxikmeolxd.supabase.co') throw new Error('Unexpected project')
const base = process.env.STAGE6_BASE_URL || 'http://127.0.0.1:3102'
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('E2E server must be local')
const { chromium } = createRequire(import.meta.url)('playwright')
const options = { auth: { persistSession: false, autoRefreshToken: false } }
const database = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, options)
const users = Array.from({ length: 2 }, () => ({
  profileId: randomUUID(), username: `V3L_Cauã_${randomUUID().replaceAll('-', '').slice(0, 12)}`,
  email: `v3library_${randomUUID()}@ghost.tracker.local`,
  password: randomBytes(24).toString('base64url'), authId: null,
  auth: createClient(process.env.SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, options)
}))
const animeIds = Array.from({length:30},()=>randomUUID())
let browser, failure, passed = 0
const artifacts = 'test-results/stage6'
function unwrap(result) {
  if (result.error) throw new Error(`Supabase operation failed (${result.error.code || 'unknown'})`)
  return result.data
}
async function snapshot() {
  const result = {}
  for (const table of ['profiles', 'anime', 'user_anime', 'profile_favorites', 'profile_pinned_anime']) {
    const rows = unwrap(await database.from(table).select('*'))
    result[table] = { count: rows.length, hash: createHash('sha256').update(rows.map((row) => JSON.stringify(row)).sort().join('\n')).digest('hex') }
  }
  return result
}
async function check(name, fn) { await fn(); passed++; console.info(`PASS ${name}`) }
async function eventually(fn, timeout = 20000) {
  const end = Date.now() + timeout
  while (!(await fn())) { if (Date.now() > end) throw new Error('Timed out waiting for state'); await delay(100) }
}
const before = await snapshot()
try {
  const statuses=['watching','planned','paused','completed','dropped']
  const labels=['Assistindo','Quero assistir','Pausado','Concluído','Abandonado']
  const secret='PRIVATE_NOTES_'+randomUUID(), privateTitle='PRIVATE_ANIME_'+randomUUID()
  const mediaBase=1000000000+Math.floor(Math.random()*800000000)
  for(const [i,user] of users.entries()) {
    user.authId=unwrap(await database.auth.admin.createUser({email:user.email,password:user.password,email_confirm:true})).user.id
    unwrap(await database.from('profiles').insert({id:user.profileId,auth_user_id:user.authId,username:user.username,profile_visibility:i?'private':'public'}))
    unwrap(await user.auth.auth.signInWithPassword({email:user.email,password:user.password}))
  }
  unwrap(await database.from('anime').insert(animeIds.map((id,i)=>({id,anilist_id:mediaBase+i,title_romaji:i===29?privateTitle:`Anime ${String(i).padStart(2,'0')}`,cover_image:i===0?'https://s4.anilist.co/file/anilistcdn/media/anime/cover/stage6-missing.jpg':i===1?'https://s4.anilist.co/file/anilistcdn/media/anime/cover/stage6-art.svg':null,status:'FINISHED',episodes:12}))))
  unwrap(await database.from('user_anime').insert(animeIds.map((id,i)=>({profile_id:users[i===29?1:0].profileId,anime_id:id,status:statuses[i%5],current_episode:3,score:87,notes:secret}))))
  const anon=createClient(process.env.SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,options)
  const url=(user=users[0],query='')=>base+'/user/'+encodeURIComponent(user.username)+'/library'+query
  async function read(client=anon,user=users[0],status=null,page=1) {return unwrap(await client.rpc('read_public_library',{p_username:user.username,p_status:status,p_page:page}))}
  function safe(data) {
    assert.deepEqual(Object.keys(data).sort(),['username','profile_visibility','is_owner','counts','page','page_size','total_items','items'].sort())
    for(const item of data.items)assert.deepEqual(Object.keys(item).sort(),['anilist_id','title','cover_image','status'].sort())
    for(const value of [secret,...users.flatMap(u=>[u.profileId,u.authId,u.email]),'current_episode','score','notes','created_at'])assert.equal(JSON.stringify(data).includes(value),false)
  }
  await check('RPC whitelist, five categories and stable pagination',async()=>{
    const first=await read();safe(first);assert.equal(first.items.length,24);assert.equal(first.counts.total,29)
    const second=await read(anon,users[0],null,2);safe(second);assert.equal(second.items.length,5)
    assert.deepEqual([...first.items,...second.items].map(x=>x.anilist_id),animeIds.slice(0,29).map((_,i)=>mediaBase+i))
    assert.equal((await read(anon,users[0],null,999)).page,2)
    for(const status of statuses){const data=await read(anon,users[0],status);safe(data);assert.ok(data.items.every(x=>x.status===status));assert.equal(data.total_items,data.counts[status])}
    assert.equal((await read(anon,{username:users[0].username.toUpperCase()})).username,users[0].username)
  })
  await check('private rows, identity spoofing and invalid RPC parameters are blocked',async()=>{
    assert.equal(await read(anon,users[1]),null);assert.equal(await read(users[0].auth,users[1]),null)
    const own=await read(users[1].auth,users[1]);safe(own);assert.equal(own.is_owner,true);assert.equal(own.items[0].title,privateTitle)
    unwrap(await users[0].auth.auth.updateUser({data:{profile_id:users[1].profileId,auth_user_id:users[1].authId}}))
    assert.equal(await read(users[0].auth,users[1]),null)
    for(const client of [anon,users[0].auth]){
      assert.equal((await client.from('user_anime').select('*')).error.code,'42501')
      assert.ok((await client.rpc('read_public_library',{p_username:users[1].username,p_profile_id:users[1].profileId})).error)
      assert.ok((await client.schema('profile_access').rpc('read_library',{p_username:users[0].username})).error)
    }
    for(const status of ['all','WATCHING',"' OR true --"] )assert.equal(await read(anon,users[0],status),null)
    for(const page of [0,-1,1000001])assert.equal(await read(anon,users[0],null,page),null)
  })
  browser=await chromium.launch({headless:true,executablePath:process.env.STAGE6_BROWSER_PATH})
  const guest=await browser.newContext({viewport:{width:1280,height:900}}),page=await guest.newPage(),errors=[]
  page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(20000)
  await page.route('**/stage6-missing.jpg',route=>route.abort())
  await page.route('**/stage6-art.svg',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="180" height="270"><rect width="180" height="270" fill="#293951"/><circle cx="90" cy="105" r="46" fill="#637c98"/></svg>'}))
  await check('public browser view, image fallback and allowed HTML/RSC fields',async()=>{
    await page.goto(base+'/user/'+encodeURIComponent(users[0].username));await page.getByRole('link',{name:'Ver biblioteca',exact:true}).click()
    await page.getByRole('heading',{name:'Biblioteca de @'+users[0].username,exact:true}).waitFor()
    assert.equal(await page.getByRole('list',{name:'Animes da biblioteca'}).locator('li').count(),24)
    await eventually(async()=>await page.getByText('Sem capa',{exact:true}).count()===23)
    for(const headers of [{},{RSC:'1'}]){
      const response=await guest.request.get(url(),{headers});assert.equal(response.status(),200);assert.ok(response.headers()['cache-control'].includes('no-store'))
      const body=await response.text();for(const value of [secret,privateTitle,users[0].profileId,users[0].authId,users[0].email,process.env.SUPABASE_SECRET_KEY,'current_episode','"score"','"notes"'])assert.equal(body.includes(value),false)
    }
    mkdirSync(artifacts,{recursive:true});await page.screenshot({path:artifacts+'/desktop.png',fullPage:true})
  })
  await check('browser pagination and all status filters',async()=>{
    await page.getByRole('link',{name:'Próxima',exact:true}).click();await page.getByText('Página 2 de 2',{exact:true}).waitFor()
    assert.equal(await page.getByRole('list',{name:'Animes da biblioteca'}).locator('li').count(),5)
    for(const [i,status] of statuses.entries()){
      await page.getByRole('navigation',{name:'Categorias da biblioteca'}).getByRole('link',{name:new RegExp('^'+labels[i]+' ')}).click()
      await page.waitForURL('**/library?status='+status)
      assert.equal(new URL(page.url()).searchParams.has('page'),false)
      assert.equal(await page.getByRole('list',{name:'Animes da biblioteca'}).locator('li').count(),status==='dropped'?5:6)
      assert.equal(await page.getByRole('list',{name:'Animes da biblioteca'}).locator('li p').filter({hasText:labels[i]}).count(),status==='dropped'?5:6)
    }
    await page.goto(url(users[0],'?page=999'));await page.getByText('Página 2 de 2',{exact:true}).waitFor()
  })
  async function blocked(target,context=guest){
    for(const headers of [{},{RSC:'1'}]){
      const response=await context.request.get(target,{headers});assert.equal(response.status(),headers.RSC?200:404)
      const body=await response.text();assert.ok(body.includes('Perfil indisponível'));assert.ok(response.headers()['cache-control'].includes('no-store'));for(const value of [privateTitle,secret,users[1].profileId,users[1].authId])assert.equal(body.includes(value),false)
    }
  }
  await check('private, missing and malformed URL views reveal no data',async()=>{
    await blocked(url(users[1]));await blocked(url({username:'V3L_missing'}))
    for(const query of ['?status=all','?page=0','?page=1&page=2','?status=watching&status=paused'])await blocked(url(users[0],query))
  })
  const owner=await browser.newContext(),ownerPage=await owner.newPage()
  async function login(user){await ownerPage.goto(base+'/login');await ownerPage.getByLabel('Username',{exact:true}).fill(user.username);await ownerPage.getByLabel('Senha',{exact:true}).fill(user.password);await ownerPage.getByRole('button',{name:'Entrar',exact:true}).click();await ownerPage.waitForURL('**/dashboard')}
  await check('existing owner status/remove/add actions update public library',async()=>{
    await login(users[0]);await ownerPage.goto(base+'/anime/'+mediaBase)
    await ownerPage.getByRole('button',{name:'Assistindo',exact:true}).click();await ownerPage.getByRole('menuitem',{name:'Concluído',exact:true}).click()
    await eventually(async()=>(await read(anon,users[0],'completed')).items.some(x=>x.anilist_id===mediaBase))
    await page.goto(url(users[0],'?status=completed'));await page.getByRole('heading',{name:'Anime 00',exact:true}).waitFor()
    await ownerPage.getByRole('button',{name:'Concluído',exact:true}).click();ownerPage.once('dialog',dialog=>dialog.accept());await ownerPage.getByRole('menuitem',{name:'Remover da coleção',exact:true}).click()
    await eventually(async()=>(await read()).counts.total===28)
    await ownerPage.getByRole('button',{name:'Adicionar à coleção',exact:true}).click()
    await eventually(async()=>(await read()).counts.total===29)
    await page.goto(url(users[0],'?status=planned'));await page.getByRole('heading',{name:'Anime 00',exact:true}).waitFor()
  })
  await check('visibility changes block warm browser visits and preserve owner access',async()=>{
    await ownerPage.goto(base+'/profile/settings');await ownerPage.getByLabel('Visibilidade do Perfil',{exact:true}).selectOption('private');await ownerPage.getByRole('button',{name:'Salvar alterações',exact:true}).click();await ownerPage.getByText('Perfil atualizado com sucesso.',{exact:true}).waitFor()
    assert.equal(await read(),null);await blocked(url())
    await ownerPage.goto(url());await ownerPage.getByText('Perfil privado · Visível apenas para você.',{exact:true}).waitFor()
    await ownerPage.goto(base+'/profile/settings');await ownerPage.getByLabel('Visibilidade do Perfil',{exact:true}).selectOption('public');await ownerPage.getByRole('button',{name:'Salvar alterações',exact:true}).click();await ownerPage.getByText('Perfil atualizado com sucesso.',{exact:true}).waitFor()
    await page.goto(url());await page.getByRole('heading',{name:'Anime 00',exact:true}).waitFor()
    await ownerPage.goto(base+'/profile');await ownerPage.getByRole('button',{name:'Sair da conta',exact:true}).click();await ownerPage.waitForURL(base+'/')
    await login(users[1]);await ownerPage.goto(url(users[1]));await ownerPage.getByRole('heading',{name:privateTitle,exact:true}).waitFor();await ownerPage.getByText('Perfil privado · Visível apenas para você.',{exact:true}).waitFor()
  })
  await check('empty category/library, mobile and keyboard navigation',async()=>{
    unwrap(await database.from('user_anime').delete().eq('profile_id',users[0].profileId).eq('status','dropped'))
    await page.goto(url(users[0],'?status=dropped'));await page.getByRole('status').getByText('Nenhum anime nesta categoria.',{exact:true}).waitFor()
    await page.setViewportSize({width:390,height:844});await page.goto(url());assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
    await page.screenshot({path:artifacts+'/mobile.png',fullPage:true})
    await page.getByRole('navigation',{name:'Categorias da biblioteca'}).getByRole('link',{name:/^Assistindo /}).focus();await page.keyboard.press('Enter');await page.waitForURL('**/library?status=watching')
    unwrap(await database.from('user_anime').delete().eq('profile_id',users[0].profileId))
    await page.goto(url());await page.getByRole('status').getByText('Esta biblioteca está vazia.',{exact:true}).waitFor();assert.equal((await read()).counts.total,0)
    assert.deepEqual(errors,[])
  })
} catch (error) {
  failure = error
} finally {
  if (browser) await browser.close()
  const cleanupErrors = []
  for (const user of users) {
    if ((await user.auth.auth.signOut()).error) cleanupErrors.push('session')
    if ((await database.from('profiles').delete().eq('id', user.profileId).eq('username', user.username)).error) cleanupErrors.push('profile')
    if (user.authId && (await database.auth.admin.deleteUser(user.authId)).error) cleanupErrors.push('auth user')
  }
  if ((await database.from('anime').delete().in('id',animeIds)).error) cleanupErrors.push('anime fixtures')
  if (cleanupErrors.length) throw new Error(`Cleanup failure: ${cleanupErrors.join(', ')}`)
}
assert.deepEqual(await snapshot(), before, 'Existing rows must be identical after fixture cleanup')
console.info('PASS cleanup and SHA-256 comparison of every original row')
if (failure) throw failure
console.info(`Public-library browser integration: ${passed + 1} checks passed; fixtures removed; screenshots in ${artifacts}.`)
