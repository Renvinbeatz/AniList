import assert from 'node:assert/strict'
import test from 'node:test'
import {loadServerModule} from './helpers/load-server-module.mjs'
const platforms=loadServerModule('src/lib/platforms.ts',{}),rules=loadServerModule('src/lib/community.ts',{'./platforms':platforms})
const valid={title:'Um anime interessante',body:'Uma discussão com respeito.',spoiler:false,image_url:''}
test('Topic contract bounds Unicode, preserves text and rejects identity overposting and unsafe images',()=>{
 assert.equal(rules.validateTopic(valid).data.image_url,null)
 assert.equal(rules.validateTopic({...valid,body:'<b>Texto</b>\n😺'}).data.body,'<b>Texto</b>\n😺')
 for(const extra of [{profile_id:'x'},{title:'😺'.repeat(121)},{body:'x'.repeat(4001)},{image_url:'javascript:alert(1)'},{spoiler:'true'},{body:'\u0000'}]) assert.ok(rules.validateTopic({...valid,...extra}).error)
})
test('Basic automoderation blocks discriminatory variants, permits mild swearing and preserves allowed text',()=>{
 for(const text of ['viadinho','V1@D1NH0','v.i.a.d.i.n.h.o','preto imundo','sieg heil','sapatão','v_i_a_d_o','viados','boiola','seu crioulo','negros inferiores']) assert.equal(rules.hasDiscriminatoryLanguage(text),true,text)
 for(const text of ['Que merda de final','macaco é um animal','a cor preta','Uma história de amizade','Revisado com atenção','Enviado ontem','Idioma crioulo']) assert.equal(rules.hasDiscriminatoryLanguage(text),false,text)
 assert.ok(rules.validateTopic({...valid,body:'v.i.a.d.i.n.h.o'}).error)
})
test('Topic actions reject unauthorized, invalid and discriminatory inputs before any mutation',async()=>{
 let session=null,called=[]
 const actions=loadServerModule('src/actions/community.ts',{
  '@/lib/session':{getSession:async()=>session},'@/data/supabase':{supabaseServerClient:{rpc:async(...args)=>{called.push(args);return{data:{id:'post'},error:null}}}},
  '@/lib/community':rules,'@/lib/platforms':platforms,'next/cache':{revalidatePath:()=>{}},
 })
 assert.ok((await actions.saveTopicAction(valid)).error);assert.equal(called.length,0)
 session={profileId:'owner'};assert.ok((await actions.saveTopicAction({...valid,body:'sieg heil'})).error);assert.equal(called.length,0)
 assert.equal((await actions.saveTopicAction(valid)).id,'post');assert.equal(called[0][1].p_actor,'owner')
})
