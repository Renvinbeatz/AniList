import assert from 'node:assert/strict'
import test from 'node:test'
import {loadServerModule} from './helpers/load-server-module.mjs'
const platforms=loadServerModule('src/lib/platforms.ts',{}),community=loadServerModule('src/lib/community.ts',{'./platforms':platforms}),rules=loadServerModule('src/lib/interactions.ts',{'./community':community})
test('Comment contract preserves plain text, bounds Unicode and rejects identity and discriminatory variants',()=>{
 assert.equal(rules.validateComment({body:' <script>literal</script> ',spoiler:true}).data.body,'<script>literal</script>')
 for(const input of [null,[],{body:'',spoiler:false},{body:'😺'.repeat(2001),spoiler:false},{body:'hello',spoiler:'false'},{body:'hello',spoiler:false,profile_id:'forged'},{body:'s.i.e.g h.e.i.l',spoiler:false}]) assert.ok(rules.validateComment(input).error)
 assert.ok(rules.validateComment({body:'Que merda, vamos conversar.',spoiler:false}).data)
 assert.equal(rules.validReportReason('harassment'),true);assert.equal(rules.validReportReason('__proto__'),false)
})
test('Interaction actions authenticate and reject malformed content before RPC',async()=>{
 let session=null,calls=[]
 const actions=loadServerModule('src/actions/interactions.ts',{'@/lib/session':{getSession:async()=>session},'@/data/supabase':{supabaseServerClient:{rpc:async(...args)=>{calls.push(args);return{data:{id:'saved'},error:null}}}},'@/lib/platforms':platforms,'@/lib/public-profile':{validPublicUsername:x=>typeof x==='string'&&x.length>=3},'@/lib/interactions':rules,'@/lib/community':community,'next/cache':{revalidatePath:()=>{}}})
 const id='b3b98a2a-3c52-4ddc-9acf-e7a119bd60cb'
 for(const result of [await actions.saveCommentAction(id,{body:'hello',spoiler:false}),await actions.blockAction('Other',true),await actions.reportAction('post',id,'spam',''),await actions.notificationReadAction(),await actions.resolveReportAction(id,true)])assert.ok(result.error)
 assert.equal(calls.length,0);session={profileId:'verified'}
 assert.ok((await actions.saveCommentAction(id,{body:'v.i.a.d.i.n.h.o',spoiler:false})).error)
 assert.ok((await actions.reportAction('post',id,'unknown','')).error);assert.ok((await actions.blockAction('Other','true')).error);assert.equal(calls.length,0)
 assert.equal((await actions.saveCommentAction(id,{body:'hello',spoiler:true})).error,null);assert.equal(calls[0][1].p_actor,'verified');assert.equal(calls[0][1].p_spoiler,true)
})
