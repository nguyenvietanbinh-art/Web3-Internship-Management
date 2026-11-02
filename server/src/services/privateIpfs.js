const crypto=require('node:crypto'),axios=require('axios'),FormData=require('form-data');
const {HttpError}=require('../utils/http');
const sha=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
function master(){const encoded=process.env.REPORT_ENCRYPTION_KEY||'';if(!/^[A-Za-z0-9+/]{43}=$/.test(encoded)||Buffer.from(encoded,'base64').length!==32)throw new HttpError(503,'Chưa cấu hình khóa mã hóa báo cáo32byte','REPORT_KEY_MISSING');return Buffer.from(encoded,'base64');}
function keyId(){const id=process.env.REPORT_ENCRYPTION_KEY_ID||'v1';if(!/^[a-zA-Z0-9_-]{1,40}$/.test(id))throw new HttpError(503,'Key ID không hợp lệ','REPORT_KEY_MISSING');return id;}
function configured(){return{pinata:!!process.env.PINATA_JWT,externalUploadEnabled:process.env.IPFS_EXTERNAL_UPLOAD_ENABLED==='true',encryptionKey:/^[A-Za-z0-9+/]{43}=$/.test(process.env.REPORT_ENCRYPTION_KEY||'')};}
function assertConfigured(){const c=configured();if(!c.pinata||!c.externalUploadEnabled)throw new HttpError(503,'IPFS live chưa cấu hình hoặc chưa bật; không upload báo cáo công khai','IPFS_NOT_CONFIGURED');master();}
function encrypt(buffer,reportId){
 if(!Buffer.isBuffer(buffer)||!buffer.length||buffer.length>2*1024*1024)throw new HttpError(400,'Tệp báo cáo phải từ1byte đến2MiB');
 const salt=crypto.randomBytes(16),iv=crypto.randomBytes(12),binding=sha(Buffer.from(String(reportId))),id=keyId();
 const key=Buffer.from(crypto.hkdfSync('sha256',master(),salt,Buffer.from('internship-private-report-v1'),32)),cipher=crypto.createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(Buffer.from(binding));
 const data=Buffer.concat([cipher.update(buffer),cipher.final()]);
 const envelope=Buffer.from(JSON.stringify({version:1,algorithm:'AES-256-GCM',keyId:id,binding,salt:salt.toString('base64'),iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),ciphertext:data.toString('base64')}));
 return{envelope,plaintextHash:sha(buffer),ciphertextHash:sha(envelope),keyId:id};
}
function decrypt(envelope,reportId){
 try{
  if(!Buffer.isBuffer(envelope)||envelope.length>4*1024*1024)throw Error('Size');const data=JSON.parse(envelope.toString('utf8'));
  const binding=sha(Buffer.from(String(reportId)));if(data.version!==1||data.algorithm!=='AES-256-GCM'||data.keyId!==keyId()||data.binding!==binding)throw Error('Binding');
  const salt=Buffer.from(data.salt,'base64'),iv=Buffer.from(data.iv,'base64'),tag=Buffer.from(data.tag,'base64');if(salt.length!==16||iv.length!==12||tag.length!==16)throw Error('Envelope');
  const key=Buffer.from(crypto.hkdfSync('sha256',master(),salt,Buffer.from('internship-private-report-v1'),32)),cipher=crypto.createDecipheriv('aes-256-gcm',key,iv);cipher.setAAD(Buffer.from(binding));cipher.setAuthTag(tag);
  return Buffer.concat([cipher.update(Buffer.from(data.ciphertext,'base64')),cipher.final()]);
 }catch(error){if(error instanceof HttpError)throw error;throw new HttpError(502,'Không xác minh được ciphertext hoặc khóa','IPFS_DECRYPT_FAILED');}
}
function validateCID(cid){
 if(typeof cid!=='string'||cid.length>120)throw new HttpError(502,'CID Pinata không hợp lệ','IPFS_BAD_CID');
 let bytes;
 if(/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(cid)){
  const alphabet='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';let value=0n;for(const c of cid)value=value*58n+BigInt(alphabet.indexOf(c));let hex=value.toString(16);if(hex.length%2)hex='0'+hex;bytes=Buffer.from(hex,'hex');if(bytes.length!==34||bytes[0]!==18||bytes[1]!==32)throw new HttpError(502,'CID multihash không hợp lệ','IPFS_BAD_CID');
 }else if(/^b[a-z2-7]{40,119}$/.test(cid)){
  const alphabet='abcdefghijklmnopqrstuvwxyz234567';let acc=0,bits=0;const decoded=[];for(const c of cid.slice(1)){acc=(acc<<5)|alphabet.indexOf(c);bits+=5;if(bits>=8){bits-=8;decoded.push((acc>>bits)&255);}}bytes=Buffer.from(decoded);if(cid.length!==59||(bits>0&&(acc&((1<<bits)-1))!==0)||bytes.length!==36||bytes[0]!==1||![0x55,0x70].includes(bytes[1])||bytes[2]!==18||bytes[3]!==32)throw new HttpError(502,'CID codec/hash không hỗ trợ','IPFS_BAD_CID');
 }else throw new HttpError(502,'Không nhận CID giả hoặc định dạng lạ','IPFS_BAD_CID');
 return cid;
}
function client(http=axios){return{
 async upload(envelope){assertConfigured();try{
  const form=new FormData();form.append('file',envelope,{filename:'encrypted-internship-report.bin',contentType:'application/octet-stream'});form.append('pinataOptions',JSON.stringify({cidVersion:1}));
  const r=await http.post('https://api.pinata.cloud/pinning/pinFileToIPFS',form,{headers:{...form.getHeaders(),Authorization:'Bearer '+process.env.PINATA_JWT},timeout:10000,maxRedirects:0,maxBodyLength:4*1024*1024,maxContentLength:1024*1024});return validateCID(r.data.IpfsHash);
 }catch(e){if(e instanceof HttpError)throw e;throw new HttpError(502,'Upload ciphertext Pinata thất bại hoặc timeout','IPFS_UPLOAD_FAILED');}},
 async readback(cid,expectedHash){validateCID(cid);try{
  const r=await http.get('https://gateway.pinata.cloud/ipfs/'+cid,{timeout:10000,maxRedirects:0,responseType:'arraybuffer',maxContentLength:4*1024*1024});const data=Buffer.from(r.data);if(sha(data)!==expectedHash)throw new HttpError(502,'Readback khác ciphertext đã upload','IPFS_READBACK_MISMATCH');return data;
 }catch(e){if(e instanceof HttpError)throw e;throw new HttpError(502,'Gateway IPFS lỗi hoặc timeout','IPFS_READBACK_FAILED');}},
};}
module.exports={sha,master,encrypt,decrypt,validateCID,configured,assertConfigured,client};
