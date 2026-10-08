import assert from 'node:assert/strict'
import test from 'node:test'
import {loadServerModule} from './helpers/load-server-module.mjs'
const rules=loadServerModule('src/lib/social.ts',{})
test('People query preserves literal punctuation, bounds Unicode and rejects control characters',()=>{
 assert.equal(rules.peopleQuery(' %_ '),'%_'); assert.equal(rules.peopleQuery('😺'.repeat(31)),null); assert.equal(rules.peopleQuery('x\ny'),null)
 assert.equal(rules.socialPage(undefined),1); assert.equal(rules.socialPage('1000'),1000)
 for(const x of ['0','-1','1.2','1001',[],{}]) assert.equal(rules.socialPage(x),null)
})
test('Follow action authenticates before RPC and derives actor from the session',async()=>{
 let session=null,calls=[]
 const actions=loadServerModule('src/actions/social.ts',{
  '@/lib/session':{getSession:async()=>session},'@/data/supabase':{supabaseServerClient:{rpc:async(...args)=>{calls.push(args);return{data:true,error:null}}}},
  '@/lib/public-profile':{validPublicUsername:x=>typeof x==='string'&&x.length>=3},'next/cache':{revalidatePath:()=>{}},
 })
 assert.ok((await actions.followAction('Target',true)).error); assert.equal(calls.length,0)
 session={profileId:'verified'}; assert.ok((await actions.followAction('Target','true')).error); assert.equal(calls.length,0)
 assert.equal((await actions.followAction('Target',true)).error,null); assert.deepEqual(calls[0][1],{p_actor:'verified',p_username:'Target',p_selected:true})
})
