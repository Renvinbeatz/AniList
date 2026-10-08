import assert from 'node:assert/strict'
import test from 'node:test'
import {loadServerModule} from './helpers/load-server-module.mjs'
const platforms=loadServerModule('src/lib/platforms.ts',{}),rules=loadServerModule('src/lib/community.ts',{'./platforms':platforms})
test('Review action authenticates, validates anime and moderates text before mutation',async()=>{
 let session=null,calls=[]
 const action=loadServerModule('src/actions/reviews.ts',{'@/lib/session':{getSession:async()=>session},'@/data/supabase':{supabaseServerClient:{rpc:async(...args)=>{calls.push(args);return{data:{id:'saved'},error:null}}}},'@/lib/community':rules,'@/lib/platforms':platforms,'next/cache':{revalidatePath:()=>{}}})
 const id='b3b98a2a-3c52-4ddc-9acf-e7a119bd60cb',input={title:'Review',body:'Uma opinião.',spoiler:true,image_url:null}
 assert.ok((await action.saveReviewAction(id,input)).error);assert.equal(calls.length,0)
 session={profileId:'owner'};assert.ok((await action.saveReviewAction('20',input)).error);assert.ok((await action.saveReviewAction(id,{...input,body:'v.i.a.d.i.n.h.o'})).error);assert.equal(calls.length,0)
 assert.equal((await action.saveReviewAction(id,input)).id,'saved');assert.equal(calls[0][1].p_anime,id);assert.equal(calls[0][1].p_actor,'owner');assert.equal(calls[0][1].p_spoiler,true)
})
