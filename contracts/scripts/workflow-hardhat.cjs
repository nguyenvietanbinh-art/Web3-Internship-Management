// Reuse the installed pinned compiler/cache. Never reset the existing 18545 chain.
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
process.chdir(root);
const old=path.join(root,'node_modules/.cache/stage2-compile/.runtime');
const runtime=fs.existsSync(old)?old:path.join(root,'node_modules/.cache/phase5-hardhat/runtime');
for(const [key,name]of [['APPDATA','appdata'],['LOCALAPPDATA','localappdata']])process.env[key]=path.join(runtime,name);
process.argv.splice(2,0,'--config',path.join(root,'hardhat.workflow.cjs'));
require('hardhat/internal/cli/cli');
