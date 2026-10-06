import assert from 'node:assert/strict'
import test from 'node:test'
import { loadServerModule } from './helpers/load-server-module.mjs'

const rules=loadServerModule('src/lib/profile-social-links.ts',{})
function harness({session={profileId:'owner'},error=null,data={id:'owner'},throws=false}={}) {
  const writes=[],paths=[]
  const actions=loadServerModule('src/actions/profile-social-links.ts',{
    '@/lib/session':{getSession:async()=>session},'@/lib/profile-social-links':rules,
    '@/data/supabase':{supabaseServerClient:{from:table=>({update:payload=>({eq:(...filter)=>({select:()=>({single:async()=>{
      writes.push({table,payload,filter});if(throws)throw new Error('Secret database detail');return {data,error}
    }})})})})}},'next/cache':{revalidatePath:(...path)=>paths.push(path)},
  })
  return {actions,writes,paths}
}
await test('Fixed catalog supports five platforms and their documented domains',()=>{
  assert.deepEqual(rules.SOCIAL_PLATFORMS.map(p=>p.id),['instagram','x','youtube','discord','github'])
  for(const platform of rules.SOCIAL_PLATFORMS)for(const host of platform.hosts){
    assert.deepEqual(rules.parseProfileSocialLinks({[platform.id]:`https://${host}/user`}),{data:{[platform.id]:`https://${host}/user`}})
  }
})
await test('Empty links normalize to SQL null; URL normalization preserves paths and Unicode',()=>{
  for(const input of [null,{}, {github:'',x:null,discord:'   '}])assert.deepEqual(rules.parseProfileSocialLinks(input),{data:null})
  assert.deepEqual(rules.parseProfileSocialLinks({github:' HTTPS://GitHub.com/Cauã '}),{data:{github:'https://github.com/Cau%C3%A3'}})
})
await test('Malformed structures and unsupported platform keys are refused',()=>{
  for(const input of [undefined,[],1,'https://github.com',true,{website:'https://example.com'},{github:{}},{x:2},JSON.parse('{"__proto__":"x"}')])assert.equal(rules.parseProfileSocialLinks(input).code,'INVALID_INPUT')
})
await test('Unsafe schemes, credentials, domain spoofing, ports and control characters are rejected',()=>{
  for(const github of ['http://github.com/user','javascript:alert(1)','data:text/html,test','//github.com/user',
    'https://github.com.evil.test/a','https://evil.test/github.com','https://github.com@evil.test','https://user:pass@github.com/a',
    'https://github.com:444/a','https://github.com./a','https://github.com/a\nb','https://github.com/%0a','https://github.com/%00','https://github.com/a b','https://github.com/'+ 'x'.repeat(2000)])assert.equal(rules.parseProfileSocialLinks({github}).code,'INVALID_INPUT')
  assert.equal(rules.parseProfileSocialLinks({github:'https://instagram.com/user'}).code,'INVALID_INPUT')
})
await test('All five links save; normalized URL length is checked after encoding',()=>{
  const links=Object.fromEntries(rules.SOCIAL_PLATFORMS.map(p=>[p.id,`https://${p.hosts[0]}/me`]))
  assert.deepEqual(rules.parseProfileSocialLinks(links),{data:links})
  const prefix='https://github.com/'
  assert.ok('data' in rules.parseProfileSocialLinks({github:prefix+'x'.repeat(2000-prefix.length)}))
  assert.equal(rules.parseProfileSocialLinks({github:prefix+'é'.repeat(500)}).code,'INVALID_INPUT')
})
await test('Authentication precedes validation and prevents writes when absent',async()=>{
  const h=harness({session:null});assert.equal((await h.actions.updateProfileSocialLinks('bad')).code,'UNAUTHORIZED');assert.deepEqual(h.writes,[])
})
await test('Invalid inputs cannot alter saved links or trigger revalidation',async()=>{
  for(const input of [{github:'javascript:alert(1)'},{github:'https://github.com/a',profile_id:'victim'},{instagram:'https://github.com/a'}]){
    const h=harness();assert.equal((await h.actions.updateProfileSocialLinks(input)).code,'INVALID_INPUT');assert.deepEqual(h.writes,[]);assert.deepEqual(h.paths,[])
  }
})
await test('Only the session owner is updated and returned identity stays on the server',async()=>{
  const h=harness();assert.deepEqual(await h.actions.updateProfileSocialLinks({github:' HTTPS://GitHub.com/user '}),{success:true})
  assert.deepEqual(h.writes,[{table:'profiles',payload:{social_links:{github:'https://github.com/user'}},filter:['id','owner']}])
  assert.deepEqual(h.paths,[['/profile'],['/profile/settings'],['/user/[username]','page']])
})
await test('Removing every link writes null; failed or missing rows never report success',async()=>{
  const h=harness();await h.actions.updateProfileSocialLinks({github:''});assert.equal(h.writes[0].payload.social_links,null)
  for(const options of [{error:{message:'Secret SQL'}},{data:null},{throws:true}]){
    const bad=harness(options),result=await bad.actions.updateProfileSocialLinks({x:'https://x.com/me'})
    assert.ok('error' in result);assert.equal(result.error.includes('Secret'),false);assert.deepEqual(bad.paths,[])
  }
})
