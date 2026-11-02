const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const QRCode=require('qrcode'),{PNG}=require('pngjs'),z=require('@zxing/library');
function bitmap(png){const p=PNG.sync.read(png),pixels=new Uint8ClampedArray(p.width*p.height);for(let i=0;i<pixels.length;i++)pixels[i]=p.data[i*4];return new z.BinaryBitmap(new z.HybridBinarizer(new z.RGBLuminanceSource(pixels,p.width,p.height)));}
test('real QR encoder/decoder roundtrips 40 random long payloads across all masks; no fixed successful fixture',async()=>{
 const {createQrReader}=await import('../src/components/business/qrDecoder.js');
 for(let i=0;i<40;i++){const token=crypto.randomBytes(380).toString('base64url')+'.'+crypto.randomBytes(32).toString('base64url');const png=await QRCode.toBuffer(token,{scale:6,margin:4,errorCorrectionLevel:'M',...(i<8?{maskPattern:i}:{})});const reader=createQrReader();assert.equal(reader.reader.decode(bitmap(png),reader.hints).getText(),token,'payload '+i);}
});
test('empty/blank pixels are rejected rather than returning invented QR content',async()=>{const {createQrReader}=await import('../src/components/business/qrDecoder.js'),p=new PNG({width:100,height:100});p.data.fill(255);const reader=createQrReader();assert.throws(()=>reader.reader.decode(bitmap(PNG.sync.write(p)),reader.hints));});
