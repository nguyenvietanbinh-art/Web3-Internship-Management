const {spawn}=require('node:child_process');
const path=require('node:path');
const {HttpError}=require('../utils/http');
let activeParsers=0;
function parseCv(buffer,kind){
 if(activeParsers>=2)return Promise.reject(new HttpError(503,'Bộ xử lý CV đang bận; thử lại sau'));
 activeParsers++;
 return new Promise((resolve,reject)=>{
  const env={PYTHONDONTWRITEBYTECODE:'1'};
  for(const key of Object.keys(process.env))if(['path','systemroot','windir','temp','tmp','comspec'].includes(key.toLowerCase()))env[key]=process.env[key];
  if(process.env.CV_PARSER_MODULE_PATH)env.PYTHONPATH=process.env.CV_PARSER_MODULE_PATH;
  const child=spawn(process.env.CV_PARSER_PYTHON||'python',['-B',path.join(__dirname,'../../parsers/cv_extract.py')],{windowsHide:true,stdio:['pipe','pipe','pipe'],env});
  let output='',done=false;const finish=(error,value)=>{if(done)return;done=true;activeParsers--;clearTimeout(timer);if(error)reject(error);else resolve(value);};
  const timer=setTimeout(()=>{child.kill();finish(new HttpError(422,'Tệp quá phức tạp hoặc xử lý vượt thời gian'));},5000);
  child.stdout.on('data',chunk=>{output+=chunk.toString();if(Buffer.byteLength(output)>400000){child.kill();finish(new HttpError(422,'Nội dung trích xuất vượt giới hạn'));}});
  child.stderr.on('data',()=>{}); // Parser diagnostics can contain private CV content; never log them.
  child.on('error',()=>finish(new HttpError(503,'Python parser chưa sẵn sàng')));
  child.stdin.on('error',()=>{});
  child.on('close',code=>{if(done)return;try{const result=JSON.parse(output);if(result.error)throw new HttpError(result.unavailable?503:422,result.error);if(code!==0||typeof result.text!=='string'||result.text.length>50000)throw new Error();finish(null,result);}catch(e){finish(e instanceof HttpError?e:new HttpError(422,'Không thể xử lý tệp CV'));}});
  child.stdin.end(JSON.stringify({kind,data:buffer.toString('base64')}));
 });
}
module.exports={parseCv};
