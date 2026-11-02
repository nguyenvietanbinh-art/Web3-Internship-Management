const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const old=path.join(root,'node_modules/.cache/stage2-compile/.runtime');
const runtime=fs.existsSync(old)?old:path.join(root,'node_modules/.cache/phase5-hardhat/runtime');
for(const [key,dir]of [['APPDATA','appdata'],['LOCALAPPDATA','localappdata']]){process.env[key]=path.join(runtime,dir);fs.mkdirSync(process.env[key],{recursive:true});}
process.argv.splice(2,0,'--config',path.join(root,'hardhat.local.cjs'));
require('hardhat/internal/cli/cli');
