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
const base = process.env.STAGE7_BASE_URL || 'http://127.0.0.1:3102'
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('E2E server must be local')
const { chromium } = createRequire(import.meta.url)('playwright')
const options = { auth: { persistSession: false, autoRefreshToken: false } }
const database = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, options)
const users = Array.from({ length: 2 }, () => ({
  profileId: randomUUID(), username: `V3S_Cauã_${randomUUID().replaceAll('-', '').slice(0, 12)}`,
  email: `v3social_${randomUUID()}@ghost.tracker.local`,
  password: randomBytes(24).toString('base64url'), authId: null,
  auth: createClient(process.env.SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, options)
}))
let browser, actionId, failure, passed = 0
const artifacts = 'test-results/stage7'
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
  const links={instagram:'https://instagram.com/v3_'+randomUUID(),x:'https://x.com/v3_'+randomUUID(),youtube:'https://youtube.com/@v3_'+randomUUID(),discord:'https://discord.gg/v3_'+randomUUID(),github:'https://github.com/v3_'+randomUUID()}
  const privateLink='https://github.com/private_'+randomUUID()
  const labels=['Instagram','X','YouTube','Discord','GitHub']
  for(const [i,user] of users.entries()){
    user.authId=unwrap(await database.auth.admin.createUser({email:user.email,password:user.password,email_confirm:true})).user.id
    unwrap(await database.from('profiles').insert({id:user.profileId,auth_user_id:user.authId,username:user.username,profile_visibility:i?'private':'public',social_links:i?{github:privateLink}:null}))
    unwrap(await user.auth.auth.signInWithPassword({email:user.email,password:user.password}))
  }
  const anon=createClient(process.env.SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,options)
  const url=(user=users[0])=>base+'/user/'+encodeURIComponent(user.username)
  async function linksInDb(user=users[0]){return unwrap(await database.from('profiles').select('social_links').eq('id',user.profileId).single()).social_links}
  browser=await chromium.launch({headless:true,executablePath:process.env.STAGE7_BROWSER_PATH})
  const owner=await browser.newContext({viewport:{width:1280,height:900}}),page=await owner.newPage(),guest=await browser.newContext(),visitor=await guest.newPage(),errors=[]
  page.setDefaultTimeout(20000);visitor.setDefaultTimeout(20000)
  page.on('pageerror',e=>errors.push(e.message));visitor.on('pageerror',e=>errors.push(e.message))
  page.on('request',req=>{if(req.method()==='POST'&&req.url()===base+'/profile/settings'&&req.headers()['next-action'])actionId=req.headers()['next-action']})
  async function login(user){await page.goto(base);await page.getByLabel('Username',{exact:true}).fill(user.username);await page.getByLabel('Senha',{exact:true}).fill(user.password);await page.getByRole('button',{name:'Entrar V3',exact:true}).click();await page.waitForURL('**/dashboard')}
  async function fill(data){for(const [i,key]of Object.keys(links).entries())await page.getByLabel(labels[i],{exact:true}).fill(data[key]??'')}
  async function save(){await page.getByRole('button',{name:'Salvar links',exact:true}).click();await page.getByText('Links sociais atualizados.',{exact:true}).waitFor()}
  await check('optional empty editor; five platform links persist and reload',async()=>{
    await login(users[0]);await page.goto(base+'/profile/settings');assert.equal(await page.getByLabel('GitHub',{exact:true}).inputValue(),'')
    await fill(links);await save();assert.deepEqual(await linksInDb(),links)
    mkdirSync(artifacts,{recursive:true});await page.getByRole('region',{name:'Links sociais',exact:true}).screenshot({path:artifacts+'/editor-desktop.png'});
    await page.reload();for(const [i,key]of Object.keys(links).entries())assert.equal(await page.getByLabel(labels[i],{exact:true}).inputValue(),links[key])
  })
  await check('owner/public pages show fixed order, safe target and correct RPC whitelist',async()=>{
    for(const target of [base+'/profile',url()]){
      await page.goto(target);const nav=page.getByRole('navigation',{name:'Links sociais',exact:true});assert.deepEqual(await nav.getByRole('link').allTextContents(),labels)
      for(const [i,key]of Object.keys(links).entries()){const link=nav.getByRole('link').nth(i);assert.equal(await link.getAttribute('href'),links[key]);assert.equal(await link.getAttribute('target'),'_blank');assert.equal(await link.getAttribute('rel'),'noopener noreferrer')}
    }
    await visitor.goto(url());await visitor.getByRole('navigation',{name:'Links sociais',exact:true}).waitFor()
    const payload=unwrap(await anon.rpc('read_public_profile',{p_username:users[0].username}));assert.deepEqual(payload.social_links,links)
    const text=JSON.stringify(payload);for(const secret of users.flatMap(u=>[u.profileId,u.authId,u.email]))assert.equal(text.includes(secret),false)
    mkdirSync(artifacts,{recursive:true});await visitor.screenshot({path:artifacts+'/desktop.png',fullPage:true})
  })
  await check('external link opens its intended address without an opener',async()=>{
    await guest.route(links.github,route=>route.fulfill({contentType:'text/html',body:'<title>Destino de teste</title>'}))
    const opened=visitor.waitForEvent('popup');await visitor.getByRole('link',{name:'GitHub (abre em nova aba)',exact:true}).click()
    const popup=await opened;await popup.waitForLoadState('domcontentloaded');assert.equal(popup.url(),links.github);assert.equal(await popup.evaluate(()=>window.opener),null);await popup.close()
  })
  await check('editing, removing one link and discarding draft changes work',async()=>{
    await page.goto(base+'/profile/settings');await page.getByLabel('X',{exact:true}).fill('https://twitter.com/new_'+randomUUID());await page.getByLabel('Discord',{exact:true}).fill('');await save()
    links.x=await page.getByLabel('X',{exact:true}).inputValue();delete links.discord
    assert.deepEqual(await linksInDb(),links)
    await page.getByLabel('GitHub',{exact:true}).fill('https://github.com/unsaved');await page.getByRole('button',{name:'Descartar links',exact:true}).click();assert.equal(await page.getByLabel('GitHub',{exact:true}).inputValue(),links.github)
    await visitor.reload();assert.equal(await visitor.getByRole('link',{name:'Discord (abre em nova aba)',exact:true}).count(),0);assert.equal(await visitor.getByRole('link',{name:'X (abre em nova aba)',exact:true}).getAttribute('href'),links.x)
  })
  await check('client/server validation and database CHECK preserve existing links',async()=>{
    await page.getByLabel('GitHub',{exact:true}).fill('https://github.com.evil.test/user');await page.getByRole('button',{name:'Salvar links',exact:true}).click();await page.getByRole('alert').getByText(/Informe links HTTPS/).waitFor();assert.deepEqual(await linksInDb(),links)
    for(const input of [{github:'javascript:alert(1)'},{github:'https://evil.test'},{github:links.github,profile_id:users[1].profileId},['https://github.com']])assert.ok((await callAction(owner,input)).includes('INVALID_INPUT'))
    for(const social_links of [{github:'http://github.com/user'},{github:'https://github.com.evil.test/user'},{extra:'https://github.com'},[],{}, {github:3},{github:'https://user@github.com/user'}])assert.equal((await database.from('profiles').update({social_links}).eq('id',users[0].profileId)).error.code,'23514')
    assert.deepEqual(await linksInDb(),links);assert.deepEqual(await linksInDb(users[1]),{github:privateLink})
  })
  await check('anonymous action and raw profile access cannot edit links',async()=>{
    assert.ok((await callAction(guest,{github:'https://github.com/hacker'})).includes('UNAUTHORIZED'))
    for(const client of [anon,users[0].auth,users[1].auth])assert.equal((await client.from('profiles').update({social_links:null}).eq('id',users[1].profileId)).error.code,'42501')
    assert.deepEqual(await linksInDb(),links)
  })
  await check('failed send retains draft; repeated save sends once; recovery persists',async()=>{
    await page.goto(base+'/profile/settings');const revised='https://github.com/recovery_'+randomUUID();await page.getByLabel('GitHub',{exact:true}).fill(revised)
    await page.route('**/profile/settings',async route=>{if(route.request().method()==='POST'){return route.abort()}return route.continue()})
    await page.getByRole('button',{name:'Salvar links',exact:true}).click();await page.getByRole('alert').getByText(/Não foi possível confirmar/).waitFor();assert.equal(await page.getByLabel('GitHub',{exact:true}).inputValue(),revised);assert.deepEqual(await linksInDb(),links);await page.unroute('**/profile/settings')
    let requests=0
    await page.route('**/profile/settings',async route=>{if(route.request().method()==='POST'){requests++;await delay(200)}return route.continue()})
    await page.getByRole('button',{name:'Salvar links',exact:true}).evaluate(el=>{el.click();el.click()});await page.getByText('Links sociais atualizados.',{exact:true}).waitFor();assert.equal(requests,1);await page.unroute('**/profile/settings')
    links.github=revised;assert.deepEqual(await linksInDb(),links)
  })
  await check('public/private transition removes social links from new HTML/RSC/RPC',async()=>{
    await page.getByLabel('Visibilidade do Perfil',{exact:true}).selectOption('private');await page.getByRole('button',{name:'Salvar alterações',exact:true}).click();await page.getByText('Perfil atualizado com sucesso.',{exact:true}).waitFor()
    assert.equal(unwrap(await anon.rpc('read_public_profile',{p_username:users[0].username})),null)
    for(const headers of [{},{RSC:'1'}]){const response=await guest.request.get(url(),{headers});const body=await response.text();assert.ok(body.includes('Perfil indisponível'));for(const value of Object.values(links))assert.equal(body.includes(value),false)}
    await page.goto(url());await page.getByRole('navigation',{name:'Links sociais',exact:true}).waitFor()
    await page.goto(base+'/profile/settings');await page.getByLabel('Visibilidade do Perfil',{exact:true}).selectOption('public');await page.getByRole('button',{name:'Salvar alterações',exact:true}).click();await page.getByText('Perfil atualizado com sucesso.',{exact:true}).waitFor()
    await visitor.goto(url());await visitor.getByRole('navigation',{name:'Links sociais',exact:true}).waitFor()
  })
  await check('mobile, keyboard, all-link removal and account switching',async()=>{
    await visitor.setViewportSize({width:390,height:844});await visitor.reload();assert.equal(await visitor.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
    const first=visitor.getByRole('navigation',{name:'Links sociais',exact:true}).getByRole('link').first();await first.focus();assert.equal(await first.evaluate(el=>el===document.activeElement),true)
    await visitor.screenshot({path:artifacts+'/mobile.png',fullPage:true})
    await page.setViewportSize({width:390,height:844});await page.goto(base+'/profile/settings');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.getByRole('region',{name:'Links sociais',exact:true}).screenshot({path:artifacts+'/editor-mobile.png'});
    for(const label of labels)await page.getByLabel(label,{exact:true}).fill('');await save();assert.equal(await linksInDb(),null)
    await visitor.reload();assert.equal(await visitor.getByRole('navigation',{name:'Links sociais',exact:true}).count(),0)
    await page.goto(base+'/profile');await page.getByRole('button',{name:'Sair da conta',exact:true}).click();await page.waitForURL(base+'/');await login(users[1]);await page.goto(base+'/profile/settings')
    assert.equal(await page.getByLabel('GitHub',{exact:true}).inputValue(),privateLink);await page.getByLabel('GitHub',{exact:true}).fill('https://github.com/second_'+randomUUID());await save();assert.equal(await linksInDb(),null)
    const privatePayload=unwrap(await users[1].auth.rpc('read_public_profile',{p_username:users[1].username}));assert.deepEqual(privatePayload.social_links,await linksInDb(users[1]));assert.equal(unwrap(await users[0].auth.rpc('read_public_profile',{p_username:users[1].username})),null)
    await visitor.goto(url(users[1]));assert.equal(await visitor.getByRole('navigation',{name:'Links sociais',exact:true}).count(),0);assert.deepEqual(errors,[])
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
  if (cleanupErrors.length) throw new Error(`Cleanup failure: ${cleanupErrors.join(', ')}`)
}
assert.deepEqual(await snapshot(), before, 'Existing rows must be identical after fixture cleanup')
console.info('PASS cleanup and SHA-256 comparison of every original row')
if (failure) throw failure
console.info(`Social-links browser integration: ${passed + 1} checks passed; fixtures removed; screenshots in ${artifacts}.`)
