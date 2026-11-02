const zlib=require('node:zlib');
function guardedPdf({javascript=false,bomb=false}={}){
 const source=bomb?Buffer.alloc(8*1024*1024+1,32):Buffer.from('BT /F1 12 Tf 40 740 Td (TEST secure parser input) Tj ET'),content=bomb?zlib.deflateSync(source):source;
 const objects=[Buffer.from(`<< /Type /Catalog /Pages 2 0 R${javascript?' /OpenAction 6 0 R':''} >>`),Buffer.from('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'),Buffer.from('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>'),Buffer.from('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'),Buffer.concat([Buffer.from(`<< /Length ${content.length}${bomb?' /Filter /FlateDecode':''} >>\nstream\n`),content,Buffer.from('\nendstream')])];
 if(javascript)objects.push(Buffer.from('<< /Type /Action /S /JavaScript /JS (app.alert\x28TEST\x29) >>'));
 const chunks=[Buffer.from('%PDF-1.4\n')],offsets=[];let size=chunks[0].length;objects.forEach((object,i)=>{offsets.push(size);const chunk=Buffer.concat([Buffer.from(`${i+1} 0 obj\n`),object,Buffer.from('\nendobj\n')]);chunks.push(chunk);size+=chunk.length;});const count=objects.length+1;
 chunks.push(Buffer.from(`xref\n0 ${count}\n0000000000 65535 f \n`+offsets.map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${size}\n%%EOF\n`));return Buffer.concat(chunks);
}
module.exports={guardedPdf};
