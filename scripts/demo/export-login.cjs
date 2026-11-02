// Explicitly export existing TEST staff passwords locally; never part of Git.
const fs=require('node:fs'),path=require('node:path');
const {root,cache,vault}=require('./common.cjs');
try{
 if(process.argv[3]!=='--export-local-passwords')throw Error('Pass runtime.json and --export-local-passwords explicitly');
 const file=path.resolve(process.argv[2]||'');
 if(!file.startsWith(cache+path.sep))throw Error('Metadata must be inside ignored cache');
 const meta=JSON.parse(fs.readFileSync(file,'utf8'));
 const uri='mongodb://127.0.0.1:27017/'+meta.database;
 require(path.join(root,'server/src/config/testDatabaseGuard')).assertTestEnvironment({nodeEnv:'test',uri,allowlistedUri:uri});
 if(meta.unified!==true||meta.origin!=='http://localhost:5182')throw Error('Only unified local TEST accounts allowed');
 const data=JSON.parse(vault('unprotect',fs.readFileSync(path.join(path.dirname(file),'staff.dpapi'),'utf8')));
 if(data.database!==meta.database)throw Error('Database mismatch');
 const lines=['INTERNOVA LOCAL TEST LOGIN',meta.origin+'/login','Do not commit/share this file or reuse these passwords.',''];
 for(const role of ['admin','company','mentor']){
  const account=data.accounts[role];if(!account)throw Error('Missing TEST staff account');
  lines.push('Role: '+role,'Email: '+account.email,'Password: '+account.password,'');
 }
 const output=path.join(path.dirname(file),'manual-login.txt');
 fs.writeFileSync(output,lines.join('\r\n'),{flag:'wx',mode:0o600});
 console.log('Local TEST login file created: '+path.relative(root,output));
}catch(e){console.error(e.code==='EEXIST'?'Login file already exists; no overwrite.':'Export refused; verify local TEST metadata, flag and Windows user.');process.exitCode=1;}
