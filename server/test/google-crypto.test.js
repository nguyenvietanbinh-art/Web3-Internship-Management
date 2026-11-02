const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {OAuth2Client}=require('google-auth-library');
const {validateClaims}=require('../src/services/googleIdentity');
// LOCAL RSA fixtures exercise Google's official JWT verification implementation.
// They are NOT tokens signed by Google and are never accepted by the runtime verifier.
test('official Google library validates local RSA signature and rejects modified signature/audience/issuer/expiry',async()=>{
 const {privateKey,publicKey}=crypto.generateKeyPairSync('rsa',{modulusLength:2048}),client=new OAuth2Client();
 const key=publicKey.export({type:'spki',format:'pem'}),aud='test.apps.googleusercontent.com',now=Math.floor(Date.now()/1000);
 const claims={iss:'https://accounts.google.com',aud,sub:'TEST_RSA',iat:now,exp:now+300,email:'rsa@example.invalid',email_verified:true,nonce:'TEST_nonce'};
 function token(p,signingKey=privateKey){const s=[{alg:'RS256',typ:'JWT',kid:'TEST_KEY'},p].map(x=>Buffer.from(JSON.stringify(x)).toString('base64url')).join('.');return s+'.'+crypto.sign('RSA-SHA256',Buffer.from(s),signingKey).toString('base64url');}
 const verify=t=>client.verifySignedJwtWithCertsAsync(t,{TEST_KEY:key},aud,['accounts.google.com','https://accounts.google.com']);
 const ticket=await verify(token(claims));assert.equal(validateClaims(ticket.getPayload(),'TEST_nonce',aud).sub,'TEST_RSA');
 for(const patch of [{aud:'other.apps.googleusercontent.com'},{iss:'https://evil.invalid'},{exp:now-1000,iat:now-2000}])await assert.rejects(()=>verify(token({...claims,...patch})));
 const other=crypto.generateKeyPairSync('rsa',{modulusLength:2048});await assert.rejects(()=>verify(token(claims,other.privateKey)));
});
