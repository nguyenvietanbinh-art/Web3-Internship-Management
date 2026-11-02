require('@nomicfoundation/hardhat-toolbox');
const {subtask}=require('hardhat/config');
const {TASK_NODE_SERVER_READY}=require('hardhat/builtin-tasks/task-names');
subtask(TASK_NODE_SERVER_READY).setAction(async({address,port})=>console.log(`Local Hardhat ready at http://${address}:${port}; test-account private keys omitted`));
module.exports={
 solidity:{version:'0.8.24',settings:{optimizer:{enabled:true,runs:200}}},
 networks:{hardhat:{chainId:31337},localhost:{url:'http://127.0.0.1:18545',chainId:31337}},
 paths:{sources:'./contracts',tests:'./test-local',cache:'./node_modules/.cache/phase5-hardhat/cache',artifacts:'./node_modules/.cache/phase5-hardhat/artifacts'},
 mocha:{timeout:30000},
};
