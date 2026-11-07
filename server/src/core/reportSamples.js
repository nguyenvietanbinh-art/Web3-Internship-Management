const fs=require('fs'),path=require('path'),mongoose=require('mongoose'),{HttpError}=require('../utils/http'),{hash}=require('./reportSampleContent');
const allowed=new Set(['internova_demo_cunhan_kysu_20261107','internova_role_qa_20261107']);
const directory=database=>{if(!allowed.has(database))throw new HttpError(404,'Chưa chuẩn bị bài mẫu cho môi trường này');return path.resolve(__dirname,'../../../contracts/node_modules/.cache/report-reading-samples',database);};
const basename=report=>String(report._id)+'-'+hash(report.content).slice(0,16);
function validate(sample,report,database){
 if(sample.database!==database||sample.reportId!==String(report._id)||sample.assignmentId!==String(report.assignmentId)||sample.sourceReportHash!==hash(report.content)||sample.sourceVersion!==report.version||sample.synthetic!==true||sample.official!==false||typeof sample.content!=='string'||sample.content.length>50000||sample.contentHash!==hash(sample.content))throw new HttpError(409,'Bài mẫu không khớp báo cáo đang xem; cần chuẩn bị lại, không tự thay bài nộp');
 return sample;
}
function read(report){const database=mongoose.connection.name,file=path.join(directory(database),basename(report)+'.json');if(!fs.existsSync(file))throw new HttpError(404,'Chưa có bài mẫu chi tiết cho báo cáo này');return validate(JSON.parse(fs.readFileSync(file,'utf8')),report,database);}
module.exports={directory,basename,validate,read};
