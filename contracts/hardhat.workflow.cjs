const base=require('./hardhat.local.cjs');
module.exports={...base,networks:{hardhat:{chainId:31337},localhost:{url:'http://127.0.0.1:18546',chainId:31337}},paths:{...base.paths,cache:'./node_modules/.cache/workflow-hardhat/cache',artifacts:'./node_modules/.cache/workflow-hardhat/artifacts'}};
