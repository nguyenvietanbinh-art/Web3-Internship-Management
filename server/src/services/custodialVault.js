// Internal TEST/local cryptography only. Never expose decrypt through an HTTP route.
'use strict';
const crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
function failure(code){const e=new Error(code);e.code=code;return e;}
const keyId=x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(x);
function aad(binding){
 if(!binding||!['userId','studentId'].every(k=>/^[a-f0-9]{24}$/.test(binding[k]))||binding.chainId!==31337)throw failure('CUSTODY_BINDING_INVALID');
 return Buffer.from(JSON.stringify({domain:'internova-custody-local-test',schemaVersion:1,userId:binding.userId,studentId:binding.studentId,chainId:binding.chainId}));
}
function decode(value,bytes){
 if(typeof value!=='string'||!value.length)throw failure('CUSTODY_ENVELOPE_INVALID');
 const b=Buffer.from(value,'base64');if(b.toString('base64')!==value||b.length!==bytes)throw failure('CUSTODY_ENVELOPE_INVALID');return b;
}
function authenticated(binding,id,version){return Buffer.concat([aad(binding),Buffer.from(JSON.stringify({keyId:id,keyVersion:version}))]);}
function createVault(config){
 if(config?.format!==1||config.environment!=='local-test'||!keyId(config.activeKeyId)||!Array.isArray(config.keys)||!config.keys.length)throw failure('CUSTODY_KEY_CONFIG_INVALID');
 const keys=new Map();let closed=false;
 try{for(const k of config.keys){
  if(!keyId(k.id)||!Number.isSafeInteger(k.version)||k.version<1||keys.has(k.id))throw failure('CUSTODY_KEY_CONFIG_INVALID');
  keys.set(k.id,{version:k.version,bytes:decode(k.keyBase64,32)});
 }if(!keys.has(config.activeKeyId))throw failure('CUSTODY_KEY_CONFIG_INVALID');}
 catch{for(const k of keys.values())k.bytes.fill(0);throw failure('CUSTODY_KEY_CONFIG_INVALID');}
 const active=keys.get(config.activeKeyId);
 function available(){if(closed)throw failure('CUSTODY_VAULT_CLOSED');}
 return Object.freeze({
  activeKeyId:config.activeKeyId,activeVersion:active.version,
  encrypt(secret,binding){available();if(!Buffer.isBuffer(secret)||secret.length!==32)throw failure('CUSTODY_SECRET_INVALID');const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',active.bytes,iv);cipher.setAAD(authenticated(binding,config.activeKeyId,active.version));const encrypted=Buffer.concat([cipher.update(secret),cipher.final()]);return{format:1,algorithm:'AES-256-GCM',keyId:config.activeKeyId,keyVersion:active.version,iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),ciphertext:encrypted.toString('base64')};},
  decrypt(envelope,binding){available();try{
   if(envelope?.format!==1||envelope.algorithm!=='AES-256-GCM')throw Error();const k=keys.get(envelope.keyId);if(!k||k.version!==envelope.keyVersion)throw Error();
   const decipher=crypto.createDecipheriv('aes-256-gcm',k.bytes,decode(envelope.iv,12));decipher.setAAD(authenticated(binding,envelope.keyId,envelope.keyVersion));decipher.setAuthTag(decode(envelope.tag,16));const part=decipher.update(decode(envelope.ciphertext,32));try{return Buffer.concat([part,decipher.final()]);}finally{part.fill(0);}
  }catch{throw failure('CUSTODY_DECRYPT_FAILED');}},
  close(){for(const k of keys.values())k.bytes.fill(0);closed=true;},
 });
}
function loadVault(env=process.env){
 if(env.NODE_ENV!=='test'||env.CUSTODIAL_LOCAL_TEST_ENABLED!=='true'||!env.CUSTODIAL_KEYRING_FILE)throw failure('CUSTODY_CONFIG_REQUIRED');
 const file=path.resolve(env.CUSTODIAL_KEYRING_FILE),repo=path.resolve(__dirname,'../../..');
 try{
  if(fs.lstatSync(file).isSymbolicLink())throw Error();const real=fs.realpathSync(file);
  if(real.toLowerCase().startsWith(repo.toLowerCase()+path.sep)||fs.statSync(real).size>65536)throw Error();
  if(process.platform==='win32'){
   // Only inspect ACL metadata. The script never reads/prints key file content.
   execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',"$ErrorActionPreference='Stop'; $s=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value; $a=Get-Acl -LiteralPath $env:INTERNOVA_ACL_FILE; if($a.Owner -ne [Security.Principal.WindowsIdentity]::GetCurrent().Name){exit 3}; foreach($r in $a.Access){if($r.IdentityReference.Translate([Security.Principal.SecurityIdentifier]).Value -ne $s -or $r.AccessControlType -ne 'Allow'){exit 4}}"],{env:{...process.env,INTERNOVA_ACL_FILE:real},stdio:'ignore',windowsHide:true,timeout:10000});
  }else if((fs.statSync(real).mode&0o077)!==0)throw Error();
  // Recovery uses an internal pipe, never a logger/API/terminal. No decrypted file is created.
  const raw=real.endsWith('.dpapi')&&process.platform==='win32'
   ?execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',"$ErrorActionPreference='Stop'; Add-Type -AssemblyName System.Security; $p=[Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes($env:INTERNOVA_ACL_FILE),[Text.Encoding]::UTF8.GetBytes('Internova custodial key backup local-test v1'),[Security.Cryptography.DataProtectionScope]::CurrentUser); try{[Console]::OpenStandardOutput().Write($p,0,$p.Length)}finally{[Array]::Clear($p,0,$p.Length)}"],{env:{...process.env,INTERNOVA_ACL_FILE:real},stdio:['ignore','pipe','ignore'],windowsHide:true,timeout:10000,maxBuffer:65536})
   :fs.readFileSync(real);
  try{return createVault(JSON.parse(raw.toString('utf8')));}finally{raw.fill(0);}
 }catch{throw failure('CUSTODY_KEY_FILE_INVALID');}
}
module.exports={createVault,loadVault,failure};
