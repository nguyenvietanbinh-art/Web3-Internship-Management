import test from 'node:test';
import assert from 'node:assert/strict';
import {getToken,setToken,invalidateSession,SESSION_EXPIRED} from '../src/api/session.js';
import {completeAction} from '../src/api/formAction.js';
import {apiRequest} from '../src/api/client.js';
const store=new Map();
globalThis.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
globalThis.window=new EventTarget();
test('401 from an older request preserves a new session and emits no expiry event',()=>{
 let events=0;const listener=()=>events++;window.addEventListener(SESSION_EXPIRED,listener);
 try{setToken('NEW_TEST_SESSION');assert.equal(invalidateSession('OLD_TEST_SESSION'),false);assert.equal(getToken(),'NEW_TEST_SESSION');assert.equal(events,0);}finally{window.removeEventListener(SESSION_EXPIRED,listener);setToken('');}
});
test('active rejected session is cleared and notifies the application once',()=>{
 let events=0;const listener=()=>events++;window.addEventListener(SESSION_EXPIRED,listener);
 try{setToken('TEST_SESSION');assert.equal(invalidateSession('TEST_SESSION'),true);assert.equal(getToken(),'');assert.equal(invalidateSession('TEST_SESSION'),false);assert.equal(events,1);}finally{window.removeEventListener(SESSION_EXPIRED,listener);}
});
test('API integration does not let a delayed 401 remove a newer token',async()=>{
 const old=globalThis.fetch;setToken('BEFORE');
 globalThis.fetch=async()=>{setToken('AFTER');return {ok:false,status:401,json:async()=>({error:'Expired'})};};
 try{await assert.rejects(apiRequest('/core/profile'),e=>e.status===401);assert.equal(getToken(),'AFTER');}finally{globalThis.fetch=old;setToken('');}
});
test('network errors do not expose internal URL or downstream details',async()=>{
 const old=globalThis.fetch;globalThis.fetch=async()=>{throw Error('TEST_PRIVATE_INTERNAL_URI');};
 try{await assert.rejects(apiRequest('/core/profile'),e=>e.code==='NETWORK'&&!e.message.includes('TEST_PRIVATE')&&!e.message.includes('localhost'));}finally{globalThis.fetch=old;}
});
test('wrong reauthentication password does not sign out an otherwise valid session',async()=>{
 const old=globalThis.fetch;setToken('VALID_TEST_SESSION');
 globalThis.fetch=async()=>({ok:false,status:401,json:async()=>({error:'Wrong password',code:'INVALID_CREDENTIALS'})});
 try{await assert.rejects(apiRequest('/auth/email/change-password',{method:'POST',body:{}}),e=>e.status===401);assert.equal(getToken(),'VALID_TEST_SESSION');}finally{globalThis.fetch=old;setToken('');}
});
test('form waits for asynchronous post-save work and propagates its failure',async()=>{
 let resolve,finished=false;const wait=new Promise(r=>{resolve=r;});
 const action=completeAction(async()=>({id:'saved'}),async value=>{assert.equal(value.id,'saved');await wait;throw Error('Refresh failed');}).finally(()=>{finished=true;});
 const rejected=assert.rejects(action,/Refresh failed/);await new Promise(r=>setTimeout(r,0));assert.equal(finished,false);resolve();await rejected;
});
test('failed mutation never invokes success callback',async()=>{
 let called=false;await assert.rejects(completeAction(async()=>{throw Error('Rejected');},()=>{called=true;}),/Rejected/);assert.equal(called,false);
});
