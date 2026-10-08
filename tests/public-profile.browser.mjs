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
const base = process.env.STAGE5_BASE_URL || 'http://127.0.0.1:3102'
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('E2E server must be local')
const { chromium } = createRequire(import.meta.url)('playwright')
const options = { auth: { persistSession: false, autoRefreshToken: false } }
const database = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, options)
const users = Array.from({ length: 2 }, () => ({
  profileId: randomUUID(), username: `V3P_Cauã_${randomUUID().replaceAll('-', '').slice(0, 12)}`,
  email: `v3public_${randomUUID()}@ghost.tracker.local`,
  password: randomBytes(24).toString('base64url'), authId: null,
  auth: createClient(process.env.SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, options)
}))
const animeIds = [randomUUID(), randomUUID()]
let browser, actionId, failure, passed = 0
const artifacts = 'test-results/stage5'
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
async function saved(user = users[0]) {
  return unwrap(await database.from('profiles').select('profile_visibility,bio').eq('id', user.profileId).single())
}
async function eventually(fn, timeout = 20000) {
  const end = Date.now() + timeout
  while (!(await fn())) { if (Date.now() > end) throw new Error('Timed out waiting for state'); await delay(100) }
}
async function callAction(context, input) {
  assert.ok(actionId)
  const response = await context.request.post(`${base}/profile/settings`, {
    headers: { 'next-action': actionId, origin: base, 'content-type': 'text/plain;charset=UTF-8' },
    data: JSON.stringify([input])
  })
  assert.equal(response.status(), 200)
  return response.text()
}
const before = await snapshot()
try {
  const markerA='PUBLIC_' + randomUUID(), markerB='PRIVATE_' + randomUUID()
  const banner='https://stage5.example.test/banner.svg'
  for(const [i,user] of users.entries()) {
    const created=unwrap(await database.auth.admin.createUser({email:user.email,password:user.password,email_confirm:true}))
    user.authId=created.user.id
    unwrap(await database.from('profiles').insert({id:user.profileId,auth_user_id:user.authId,username:user.username,
      display_name:i ? markerB : markerA,bio:(i ? markerB : markerA) + '\n<script>window.publicUnsafe=true</script>',
      banner_url:i ? 'https://stage5.example.test/PRIVATE_BANNER.jpg' : banner,avatar_preset:'purple',
      favorite_character_anilist_id:i ? null : 40,profile_visibility:i ? 'private' : 'public'}))
    unwrap(await user.auth.auth.signInWithPassword({email:user.email,password:user.password}))
  }
  unwrap(await database.from('anime').insert(animeIds.map((id,i)=>({id,anilist_id:-(Date.now()%1000000000+i),title_romaji:i ? markerB+'_ANIME' : markerA+'_ANIME',cover_image:null}))))
  for(const [i,user] of users.entries()) {
    unwrap(await database.from('profile_favorites').insert({profile_id:user.profileId,anime_id:animeIds[i],position:3}))
    unwrap(await database.from('profile_pinned_anime').insert({profile_id:user.profileId,anime_id:animeIds[i],position:6}))
    unwrap(await database.from('user_anime').insert({profile_id:user.profileId,anime_id:animeIds[i],status:'watching',current_episode:1}))
  }
  const anon=createClient(process.env.SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,options)
  const url=user=>base+'/user/'+encodeURIComponent(user.username)
  async function read(client,user=users[0]) {return unwrap(await client.rpc('read_public_profile',{p_username:user.username}))}
  function assertDisplayOnly(payload) {
    assert.deepEqual(Object.keys(payload).sort(),['social_links','username','display_name','bio','banner_url','avatar_preset','favorite_character_anilist_id','profile_visibility','is_owner','collections'].sort())
    const text=JSON.stringify(payload)
    for(const user of users){assert.equal(text.includes(user.profileId),false);assert.equal(text.includes(user.authId),false);assert.equal(text.includes(user.email),false)}
    for(const key of ['profile_id','auth_user_id','user_anime','current_episode','created_at']) assert.equal(text.includes('"'+key+'"'),false)
  }
  await check('anonymous RPC exposes only approved display fields and populated ordered collections',async()=>{
    const profile=await read(anon)
    assertDisplayOnly(profile);assert.equal(profile.is_owner,false)
    assert.equal(profile.username,users[0].username)
    assert.deepEqual(profile.collections.favorites.map(x=>x.position),[3]);assert.deepEqual(profile.collections.pinned.map(x=>x.position),[6])
    assert.equal(profile.collections.favorites[0].anime.title_romaji,markerA+'_ANIME')
    assert.equal(await read(anon,users[1]),null)
  })
  await check('database rejects direct rows, writes and access to non-exposed helper',async()=>{
    for(const client of [anon,users[0].auth,users[1].auth]) {
      for(const table of ['profiles','profile_favorites','profile_pinned_anime','user_anime']) {
        const result=await client.from(table).select('*');assert.ok(result.error);assert.equal(result.error.code,'42501');assert.equal(result.data,null)
      }
      assert.equal((await client.from('profiles').update({profile_visibility:'public'}).eq('id',users[1].profileId)).error.code,'42501')
      assert.equal((await client.from('profile_favorites').delete().eq('profile_id',users[0].profileId)).error.code,'42501')
      assert.ok((await client.rpc('read_public_profile',{p_username:users[1].username,p_profile_id:users[1].profileId,p_auth_user_id:users[1].authId})).error)
    }
    assert.ok((await anon.rpc('read_profile',{p_username:users[0].username})).error)
    assert.ok((await anon.schema('profile_access').rpc('read_profile',{p_username:users[0].username})).error)
    assert.equal((await saved(users[1])).profile_visibility,'private')
  })
  await check('authenticated owner can read own private profile; another account cannot',async()=>{
    const own=await read(users[1].auth,users[1]);assertDisplayOnly(own)
    assert.equal(own.is_owner,true);assert.equal(own.profile_visibility,'private')
    assert.equal(await read(users[0].auth,users[1]),null)
    const other=await read(users[1].auth,users[0]);assert.equal(other.is_owner,false)
    assert.equal(other.display_name,markerA)
  })
  await check('SQL lookup is exact for percent/underscore/quotes and accepts existing case/accents',async()=>{
    for(const p_username of [users[0].username.toLowerCase(),users[0].username.toUpperCase()]) {
      const caseResult=unwrap(await anon.rpc('read_public_profile',{p_username}))
      assert.equal(caseResult.username,users[0].username)
    }
    for(const p_username of ['%','V3P%','___',"' OR true --",'nonexistent_v3_public']) assert.equal(unwrap(await anon.rpc('read_public_profile',{p_username})),null)
  })
  browser=await chromium.launch({headless:true,executablePath:process.env.STAGE5_BROWSER_PATH})
  const guest=await browser.newContext({viewport:{width:1280,height:900}}),page=await guest.newPage(),errors=[]
  page.setDefaultTimeout(20000)
  page.on('pageerror',error=>errors.push(error.message))
  await page.route(banner,route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="240"><rect width="800" height="240" fill="#243c58"/></svg>'}))
  async function assertBlocked(context,target,markers) {
    const response=await context.request.get(target)
    assert.equal(response.status(),404)
    const body=await response.text()
    assert.ok(body.includes('Perfil indisponível'))
    for(const secret of markers) assert.equal(body.includes(secret),false)
    assert.ok(response.headers()['cache-control'].includes('no-store'))
    const flight=await context.request.get(target,{headers:{RSC:'1'}})
    const payload=await flight.text()
    for(const secret of markers) assert.equal(payload.includes(secret),false)
    return response
  }
  await check('anonymous direct public URL renders profile art, bio and highlights without library data',async()=>{
    const response=await page.goto(url(users[0]))
    assert.equal(response.status(),200);assert.ok(response.headers()['cache-control'].includes('no-store'))
    await page.getByRole('heading',{name:markerA,exact:true}).waitFor()
    await page.getByRole('img',{name:'Avatar normal, fundo lavanda',exact:true}).waitFor()
    await page.getByRole('region',{name:'Animes favoritos',exact:true}).getByText(markerA+'_ANIME',{exact:false}).waitFor()
    assert.equal(await page.getByRole('link',{name:'Editar perfil',exact:true}).count(),0)
    assert.equal(await page.getByRole('link',{name:'Entrar',exact:true}).count(),1)
    assert.equal(await page.getByText('Sua coleção',{exact:true}).count(),0)
    assert.equal(await page.evaluate(()=>window.publicUnsafe),undefined)
    const html=await response.text()
    for(const secret of [users[0].profileId,users[0].authId,users[0].email,process.env.SUPABASE_SECRET_KEY,'current_episode',markerB]) assert.equal(html.includes(secret),false)
    mkdirSync(artifacts,{recursive:true});await page.screenshot({path:artifacts+'/desktop.png',fullPage:true})
  })
  await check('private and missing profiles have same neutral 404; HTML and RSC omit private fields',async()=>{
    const missing=base+'/user/no_such_'+randomUUID()
    await assertBlocked(guest,url(users[1]),[markerB,'PRIVATE_BANNER',users[1].profileId,users[1].authId,users[1].email])
    await assertBlocked(guest,missing,[markerA,markerB])
    await page.goto(url(users[1]));await page.getByRole('heading',{name:'Perfil indisponível',exact:true}).waitFor()
    await page.goto(missing);await page.getByRole('heading',{name:'Perfil indisponível',exact:true}).waitFor()
  })
  const owner=await browser.newContext(),ownerPage=await owner.newPage()
  ownerPage.on('request',req=>{if(req.method()==='POST'&&req.url()===base+'/profile/settings'&&req.headers()['next-action'])actionId=req.headers()['next-action']})
  async function login(target,user) {
    await target.goto(base + '/login')
    await target.getByLabel('Username',{exact:true}).fill(user.username)
    await target.getByLabel('Senha',{exact:true}).fill(user.password)
    await target.getByRole('button',{name:'Entrar',exact:true}).click()
    await target.waitForURL('**/dashboard')
  }
  async function visibility(value) {
    await ownerPage.goto(base+'/profile/settings')
    await ownerPage.getByLabel('Visibilidade do Perfil',{exact:true}).selectOption(value)
    await ownerPage.getByRole('button',{name:'Salvar alterações',exact:true}).click()
    await ownerPage.getByText('Perfil atualizado com sucesso.',{exact:true}).waitFor()
    assert.equal((await saved()).profile_visibility,value)
  }
  await check('owner login and profile-page link use encoded username; editing link is owner-only',async()=>{
    await login(ownerPage,users[0]);await ownerPage.goto(base+'/profile')
    const link=ownerPage.getByRole('link',{name:'Ver página do perfil',exact:true})
    assert.equal(await link.getAttribute('href'),'/user/'+encodeURIComponent(users[0].username))
    await link.click();await ownerPage.getByRole('link',{name:'Editar perfil',exact:true}).waitFor()
    assert.equal(await ownerPage.getByRole('heading',{name:markerA,exact:true}).count(),1)
  })
  await check('public-to-private immediately blocks fresh HTML, RSC and RPC after a warm visit',async()=>{
    await page.goto(url(users[0]));await page.getByRole('heading',{name:markerA,exact:true}).waitFor()
    await visibility('private')
    await assertBlocked(guest,url(users[0]),[markerA,users[0].profileId,users[0].authId])
    assert.equal(await read(anon),null)
    await page.reload();await page.getByRole('heading',{name:'Perfil indisponível',exact:true}).waitFor()
    await ownerPage.goto(url(users[0]));await ownerPage.getByText('Perfil privado · Visível apenas para você.',{exact:true}).waitFor()
    await ownerPage.getByRole('heading',{name:markerA,exact:true}).waitFor()
  })
  await check('editable user metadata cannot claim another private profile',async()=>{
    unwrap(await users[1].auth.auth.updateUser({data:{profile_id:users[0].profileId,auth_user_id:users[0].authId}}))
    assert.equal(await read(users[1].auth,users[0]),null)
    assert.equal((await read(users[1].auth,users[1])).is_owner,true)
  })
  const other=await browser.newContext(),otherPage=await other.newPage()
  await check('another authenticated account cannot browse private owner profile',async()=>{
    await login(otherPage,users[1]);await otherPage.goto(url(users[0]))
    await otherPage.getByRole('heading',{name:'Perfil indisponível',exact:true}).waitFor()
    await assertBlocked(other,url(users[0]),[markerA,users[0].profileId,users[0].authId])
    await otherPage.goto(url(users[1]));await otherPage.getByRole('heading',{name:markerB,exact:true}).waitFor()
    await otherPage.getByText('Perfil privado · Visível apenas para você.',{exact:true}).waitFor()
  })
  await check('private-to-public restores visitors; case-insensitive accented URL keeps canonical username',async()=>{
    await visibility('public')
    await page.goto(base+'/user/'+encodeURIComponent(users[0].username.toLowerCase()))
    await page.getByRole('heading',{name:markerA,exact:true}).waitFor()
    await page.getByText('@'+users[0].username,{exact:true}).waitFor()
    assert.equal((await read(anon)).is_owner,false)
    await otherPage.goto(url(users[0]));await otherPage.getByRole('heading',{name:markerA,exact:true}).waitFor()
    assert.equal(await otherPage.getByRole('link',{name:'Editar perfil',exact:true}).count(),0)
  })
  await check('profile updates and collections revalidate public view; account switching does not leak ownership',async()=>{
    assert.ok((await callAction(owner,{bio:'Bio pública atualizada'})).includes('"success":true'))
    await page.goto(url(users[0]));await page.getByText('Bio pública atualizada',{exact:true}).waitFor()
    await ownerPage.goto(base+'/profile/settings')
    await ownerPage.getByRole('button',{name:'Remover '+markerA+'_ANIME de Favoritos',exact:true}).click()
    await eventually(async()=>unwrap(await database.from('profile_favorites').select('*').eq('profile_id',users[0].profileId)).length===0)
    await page.reload();assert.equal(await page.getByRole('region',{name:'Animes favoritos',exact:true}).count(),0)
    assert.equal(await page.getByRole('region',{name:'Animes fixados',exact:true}).count(),1)
    await ownerPage.goto(base+'/profile')
    await ownerPage.getByRole('button',{name:'Sair da conta',exact:true}).click();await ownerPage.waitForURL(base+'/')
    await ownerPage.goto(url(users[0]));assert.equal(await ownerPage.getByRole('link',{name:'Editar perfil',exact:true}).count(),0)
    await login(ownerPage,users[1]);await ownerPage.goto(url(users[0]))
    assert.equal(await ownerPage.getByRole('link',{name:'Editar perfil',exact:true}).count(),0)
    await assertBlocked(guest,url(users[1]),[markerB,'PRIVATE_BANNER'])
  })
  await check('public profile works on mobile and by keyboard, with no runtime errors',async()=>{
    await page.setViewportSize({width:390,height:844});await page.goto(url(users[0]))
    await page.getByRole('heading',{name:markerA,exact:true}).waitFor()
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
    await page.getByRole('link',{name:'Entrar',exact:true}).focus();assert.equal(await page.getByRole('link',{name:'Entrar',exact:true}).evaluate(el=>el===document.activeElement),true)
    await page.screenshot({path:artifacts+'/mobile.png',fullPage:true})
    await page.keyboard.press('Enter');await page.waitForURL(base+'/login')
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
console.info(`Public-profile browser integration: ${passed + 1} checks passed; fixtures removed; screenshots in ${artifacts}.`)
