// An in-process principal, never derived from request JSON or issued as a JWT.
const principals=new WeakSet();
function createPrincipal(){const p=Object.freeze({role:'system',service:'custodial-certificate-worker'});principals.add(p);return p;}
module.exports={createPrincipal,isSystem:p=>!!p&&principals.has(p)};
