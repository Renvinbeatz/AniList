import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { randomUUID, randomBytes, createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

export async function socialKit(extraTables) {
  if (!process.argv.includes('--live')) throw new Error('Use --live for isolated social tests')
  if (existsSync('.env.local')) process.loadEnvFile('.env.local')
  if (existsSync('.env')) process.loadEnvFile('.env')
  if (new URL(process.env.SUPABASE_URL).hostname !== 'hhprevdkcvqxikmeolxd.supabase.co') throw new Error('Unexpected project')
  const base = process.env.SOCIAL_BASE_URL || 'http://127.0.0.1:3015'
  if (!['localhost','127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Local server required')
  const options = { auth: { persistSession: false, autoRefreshToken: false } }
  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, options)
  const anon = createClient(process.env.SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, options)
  const unwrap = result => { if (result.error) throw new Error(`Database error ${result.error.code}`); return result.data }
  const tables = [...new Set(['profiles','anime','user_anime','profile_favorites','profile_pinned_anime','platforms','user_anime_platforms','personal_platforms','user_anime_personal_platforms','profile_follows','community_posts','social_publish_log','library_activity','profile_blocks','community_comments','social_notifications','community_moderators','community_reports', ...extraTables])]
  const snapshot = async () => {
    const data = {}
    for (const table of tables) data[table] = createHash('sha256').update(unwrap(await db.from(table).select('*')).map(x=>JSON.stringify(x)).sort().join('\n')).digest('hex')
    return data
  }
  const before = await snapshot(), users = [], contexts = []
  let browser
  const prefix = `V4S_${randomUUID().replaceAll('-','').slice(0,9)}`
  async function user(suffix, visibility = 'public') {
    const item = { id: randomUUID(), username: `${prefix}_${suffix}`, email: `${randomUUID()}@ghost.tracker.local`, password: randomBytes(24).toString('base64url'), authId: null }
    users.push(item)
    item.authId = unwrap(await db.auth.admin.createUser({email:item.email,password:item.password,email_confirm:true})).user.id
    unwrap(await db.from('profiles').insert({id:item.id,auth_user_id:item.authId,username:item.username,profile_visibility:visibility}))
    item.client=createClient(process.env.SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,options)
    item.token=unwrap(await item.client.auth.signInWithPassword({email:item.email,password:item.password})).session.access_token
    return item
  }
  async function context(item) {
    if (!browser) browser = await createRequire(import.meta.url)('playwright').chromium.launch({ headless:true, executablePath:process.env.SOCIAL_BROWSER_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' })
    const ctx = await browser.newContext({viewport:{width:1280,height:900}}); contexts.push(ctx)
    const page = await ctx.newPage(); page.setDefaultTimeout(30000)
    if (item) {
      await page.goto(base+'/login'); await page.getByLabel('Username',{exact:true}).fill(item.username); await page.getByLabel('Senha',{exact:true}).fill(item.password)
      await page.getByRole('button',{name:'Entrar',exact:true}).click(); await page.waitForURL('**/dashboard')
    }
    return {ctx,page}
  }
  async function cleanup() {
    await browser?.close()
    for (const item of users) {
      if (item.authId) {
        if(item.token)unwrap(await db.auth.admin.signOut(item.token,'global'))
        unwrap(await db.from('profiles').delete().eq('id',item.id))
        unwrap(await db.auth.admin.deleteUser(item.authId))
      }
    }
    assert.deepEqual(await snapshot(),before,'Original records changed')
  }
  return {db,anon,unwrap,base,user,context,cleanup,prefix}
}
