'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createStore,DATABASE,URI}=require('../src/services/custodialTestStore');
const actor={role:'admin',userId:'111111111111111111111111'};
for(const role of ['student','company','mentor'])test(role+' denied before database access',async()=>{const store=createStore({db:{},vault:{},env:{}});await assert.rejects(()=>store.provision({...actor,role},'222222222222222222222222'),{code:'CUSTODY_FORBIDDEN'});});
for(const [name,changes]of [['production',{NODE_ENV:'production'}],['wrong URI',{CUSTODIAL_TEST_URI:'mongodb://127.0.0.1:27018/internova_large_test_20261108'}],['disabled',{CUSTODIAL_LOCAL_TEST_ENABLED:'false'}]])test(name+' rejected before database access',async()=>{const env={NODE_ENV:'test',CUSTODIAL_LOCAL_TEST_ENABLED:'true',CUSTODIAL_TEST_URI:URI,CUSTODIAL_TEST_URI_ALLOWLIST:URI,...changes};const store=createStore({db:{databaseName:DATABASE},vault:{},env});await assert.rejects(()=>store.provision(actor,'222222222222222222222222'),{code:'CUSTODY_TEST_ONLY'});});
