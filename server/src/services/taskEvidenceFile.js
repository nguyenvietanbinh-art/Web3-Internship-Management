const {HttpError}=require('../utils/http');
async function validate(file,name){
 const ext=name.split('.').pop().toLowerCase(),b=file.buffer,mimes={pdf:['application/pdf'],docx:['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],txt:['text/plain'],zip:['application/zip','application/x-zip-compressed'],png:['image/png'],jpg:['image/jpeg'],jpeg:['image/jpeg']};
 if(!mimes[ext]||(!mimes[ext].includes(file.mimetype)&&file.mimetype!=='application/octet-stream'))throw new HttpError(415,'Loại nội dung không khớp tên tệp minh chứng');
 let valid=false;
 if(ext==='pdf')valid=b.subarray(0,5).toString()==='%PDF-'&&b.subarray(Math.max(0,b.length-2048)).includes(Buffer.from('%%EOF'));
 if(ext==='png')valid=b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 if(['jpg','jpeg'].includes(ext))valid=b[0]===255&&b[1]===216&&b[2]===255;
 if(ext==='zip')valid=b[0]===80&&b[1]===75&&b[2]===3&&b[3]===4;
 if(ext==='txt'){try{const text=new TextDecoder('utf-8',{fatal:true}).decode(b);valid=text.length>0&&!text.includes('\0');}catch{valid=false;}}
 if(ext==='docx'){if(b.length>2*1024*1024)throw new HttpError(413,'DOCX minh chứng tối đa 2 MiB');await require('./cvParser').parseCv(b,'docx');valid=true;}
 if(!valid)throw new HttpError(415,'Nội dung tệp không hợp lệ với định dạng minh chứng');
 return mimes[ext][0];
}
module.exports={validate};
