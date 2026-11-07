// Transparent rules, not a trained quality classifier. BERT retrieves evidence; cosine never becomes a mark.
const VERSION='report-rules-v1.1';
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
const stop=new Set('va cua cac nhung duoc voi cho mot nay bao cao cong viec sinh vien de tai thuc tap phan tich ket qua thuc hien chuc nang yeu cau muc tieu xay dung kiem thu bo du lieu ma nguon san pham tai lieu'.split(' '));
const terms=text=>[...new Set(normalize(text).match(/[a-z0-9.]{3,}/g)||[])].filter(t=>!stop.has(t));
const sectionIds=heading=>{const h=normalize(heading),ids=[];if(/muc tieu|pham vi|yeu cau/.test(h))ids.push('goals');if(/phan tich|thiet ke|cach thuc hien|phuong phap|dong gop/.test(h))ids.push('method');if(/ket qua|san pham/.test(h))ids.push('results');if(/kiem thu|bang chung|minh chung|tai lieu doi chieu/.test(h))ids.push('evidence');if(/kho khan|bai hoc|cai tien|ke hoach/.test(h))ids.push('reflection');if(/tai lieu|tham khao|trinh bay|tu danh gia/.test(h))ids.push('presentation');return ids;};
function sections(content){
 const headings=[...content.matchAll(/^\s*\d+[.)]\s+([^\n]{3,130})$/gm)];
 return headings.map((m,i)=>({ids:sectionIds(m[1]),heading:m[1],start:m.index+m[0].length,end:headings[i+1]?.index??content.length}));
}
function score(report,ctx,semantic,evidence){
 const content=String(report.content||''),parts=sections(content),all=normalize(content),taskTerms=terms(ctx.tasks.map(t=>[t.title,t.objective,...(t.requiredProducts||[])].join(' ')).join(' '));
 const reportTerms=new Set(all.match(/[a-z0-9.]{3,}/g)||[]),common=taskTerms.filter(t=>reportTerms.has(t)),confirmed=evidence.references.filter(r=>r.type==='task-file'&&r.hashVerified&&r.companyConfirmed),readFailure=evidence.errors.length>0;
 const sourceRefs=new Map(evidence.references.map(r=>[r.source,r]));
 const criterionResults=ctx.rubric.criteria.map(c=>{
  const found=semantic.criteria?.find(r=>r.id===c.id),matches=(found?.matches||[]).filter(m=>m.source==='submission'?m.start>=0&&m.end<=content.length&&content.slice(m.start,m.end)===m.quote:sourceRefs.has(m.source));
  const selected=parts.filter(p=>p.ids.includes(c.id)),quotes=selected.map(p=>({source:'submission',start:p.start,end:Math.min(p.end,p.start+700),quote:content.slice(p.start,Math.min(p.end,p.start+700))}));
  const raw=selected.length?selected.map(p=>content.slice(p.start,p.end)).join('\n'):matches.filter(m=>m.source==='submission').map(m=>m.quote).join('\n');
  const text=normalize(raw),positive=text.split(/[.!?\n]/).filter(s=>!/(?:chua|khong)\s+(?:co|hoan thanh|trien khai|thuc hien|kiem thu|dap ung|cung cap)/.test(s)).join(' ');
  const checks=[];const add=(label,condition)=>checks.push({requirement:label,matched:Boolean(condition)});
  if(c.id==='goals'){
   add('Nêu mục tiêu hoặc vấn đề cụ thể',/muc tieu|van de|tim|xay dung|phat trien/.test(text)&&common.length>=2);
   add('Giới hạn phạm vi và phần chưa thực hiện',/pham vi|chua bao gom|khong bao gom|gioi han/.test(text));
   add('Nêu sản phẩm cần bàn giao',/san pham|ban giao|dau ra/.test(text));
   add('Liên hệ yêu cầu nhiệm vụ',/yeu cau|dieu kien|tieu chi/.test(text)&&common.length>=2);
  }else if(c.id==='method'){
   add('Giải thích đầu vào, đầu ra hoặc thiết kế',/dau vao|dau ra|thiet ke|kien truc/.test(text));
   add('Có cơ chế thực hiện cụ thể',/normalize|unicode|array\.filter|jwt|schema|truy van|endpoint|transaction|ham |thuat toan|kiem tra dau vao/.test(positive));
   add('Nêu lý do hoặc giới hạn giải pháp',/ly do|vi |phu hop|de |danh doi|gioi han/.test(text));
   add('Có phần việc thực hiện liên hệ nhiệm vụ',/toi |da |tach |ket hop|trien khai|viet /.test(positive)&&common.length>=2);
  }else if(c.id==='results'){
   add('Trình bày kết quả cụ thể',/tra (?:dung|ve)|thanh cong|hoan thanh|dat duoc|da (?:xay dung|viet|thuc hien)|\d+ (?:ca|de tai|kiem thu)/.test(positive));
   add('Đối chiếu yêu cầu',/yeu cau|doi chieu|dieu kien|dap ung/.test(text));
   add('Có tệp đúng phiên bản được doanh nghiệp xác nhận',confirmed.length>0);
   add('Ghi rõ phần chưa kiểm chứng hoặc giới hạn',/chua|gioi han|pham vi/.test(text));
  }else if(c.id==='evidence'){
   add('Có tệp đọc được và hash/phiên bản khớp',evidence.references.some(r=>r.hashVerified&&r.readable));
   add('Có mô tả ca kiểm tra và kết quả',/kiem thu|kiem tra/.test(text)&&/ca |assert|ket qua|truong hop/.test(text));
   add('Tệp bằng chứng có nội dung kiểm thử/kết quả',evidence.documents.some(d=>/assert|# pass|ok \d|ket qua|kiem thu|test\(/.test(normalize(d.text))));
   add('Có xác nhận doanh nghiệp của đúng bài nộp',confirmed.length>0);
  }else if(c.id==='reflection'){
   add('Nêu khó khăn cụ thể',/kho khan/.test(text)&&/la |do |vi |khi /.test(text)&&common.length>0);
   add('Giải thích cách xử lý',/bien phap|giai phap|xu ly|chuan hoa|bo sung/.test(text));
   add('Có bài học rút ra',/bai hoc|rut ra|kinh nghiem/.test(text));
   add('Có kế hoạch tiếp theo cụ thể',/ke hoach|cai tien|tiep theo/.test(text)&&/kiem thu|validation|truy van|trien khai|bo sung/.test(text));
  }else if(c.id==='presentation'){
   add('Có bố cục đánh số rõ',parts.length>=4);
   add('Có nội dung trong nhiều mục',parts.filter(p=>content.slice(p.start,p.end).trim().length>=50).length>=5);
   add('Có nguồn tài liệu nhận diện được',/tai lieu tham khao|nguon tai lieu/.test(text)&&/node|javascript|mdn|solidity|react|mongodb|https?:/.test(text));
   add('Có đường dẫn hoặc trích dẫn tài liệu cụ thể',/https?:\/\/[^\s]+|\[\d+\]/.test(text));
  }
  let level=null,mark=null,status='INSUFFICIENT_EVIDENCE',reason='Chưa có nội dung/bằng chứng đủ để chấm tiêu chí này.';
  if(c.id==='progress'){
   if(ctx.progress!==null){mark=Math.round(c.max*ctx.progress)/100;reason='Từ tiến độ công việc đã được doanh nghiệp xác nhận: '+ctx.progress.toFixed(2)+'%.';status='PROPOSED_NOT_APPROVED';}
  }else if(readFailure&&['results','evidence'].includes(c.id)){
   status='NEEDS_REVIEW';reason='Có tệp chưa đọc được đầy đủ; không tự cho 0 điểm vì lỗi xử lý.';
  }else if(raw.trim()){
   const matched=checks.filter(x=>x.matched).length;
   level=matched?Math.min(3,matched):null; // No signals is insufficient evidence, not an automatic zero.
   if(level!==null&&common.length<2&&c.id!=='presentation')level=Math.min(level,1);
   if(level!==null&&['results','evidence'].includes(c.id)&&!confirmed.length)level=Math.min(level,1);
   if(level!==null&&!selected.length)level=Math.min(level,2); // Retrieved fragments alone do not establish a complete criterion section.
   // Rubric-like headings/claims alone are not verified achievement.
   if(!quotes.length&&!matches.length)level=null;
   if(level!==null){mark=Math.round(c.max*level*25)/100;status='PROPOSED_NOT_APPROVED';reason=`Quy tắc ${VERSION}: đáp ứng ${matched}/${checks.length} dấu hiệu được mô tả; mức ${level}/4, tự động tối đa 3/4. Không xác minh thay giảng viên.`;}
  }
  const standard=require('../../../shared/report-rubric.json').criteria.find(r=>r.id===c.id);
  if(c.id!=='progress'&&normalize(c.hint).trim()!==normalize(standard?.hint).trim()){
   mark=null;level=null;status='NEEDS_REVIEW';reason='Yêu cầu học thuật của tiêu chí đã tùy chỉnh; bộ quy tắc hiện tại chưa bao phủ yêu cầu này. Giảng viên cần kiểm tra, không áp điểm mặc định.';
  }
  const levelInfo=ctx.rubric.levels?.find(r=>r.level===level);
  return{id:c.id,label:c.label,max:c.max,maxScore:c.max,score:mark,suggestedScore:mark,scoringLevel:level===null?null:{level,label:levelInfo?.label||''},evidence:[...quotes,...matches].filter((m,i,arr)=>arr.findIndex(x=>x.source===m.source&&x.start===m.start&&x.end===m.end)===i).slice(0,4),evidenceReferences:evidence.references.filter(r=>confirmed.includes(r)||r.type==='report-file'),matchedRequirements:checks.filter(r=>r.matched).map(r=>r.requirement),missingRequirements:checks.filter(r=>!r.matched).map(r=>r.requirement),basis:reason,explanation:reason,confidence:null,confidenceStatus:'NOT_CALIBRATED',evaluationStatus:status,verified:c.id==='progress'&&mark!==null,hint:c.hint};
 });
 const complete=criterionResults.every(c=>c.score!==null),total=complete?Math.round(criterionResults.reduce((n,c)=>n+c.score,0)*100)/100:null;
 return{status:complete?'PROPOSED_NOT_APPROVED':criterionResults.some(c=>c.evaluationStatus==='NEEDS_REVIEW')?'NEEDS_REVIEW':'INSUFFICIENT_EVIDENCE',evaluationStatus:complete?'PROPOSED_NOT_APPROVED':'NEEDS_REVIEW',total,suggestedTotal:total,partialTotal:Math.round(criterionResults.reduce((n,c)=>n+(c.score??0),0)*100)/100,missingTotalReason:complete?null:'Còn tiêu chí chưa đủ căn cứ hoặc tài liệu cần kiểm tra lại.',criteria:criterionResults,criterionResults,rubric:ctx.rubric,rubricVersion:ctx.rubric.version,scoringEngineVersion:VERSION,formula:'Nội dung: maxScore × scoringLevel / 4; tiến độ: maxScore × tiến độ đã xác nhận / 100. Cosine chỉ hỗ trợ truy xuất bằng chứng.',summary:complete?'Điểm AI sơ bộ theo quy tắc công khai; giảng viên cần kiểm tra và xác nhận.':'Chưa đủ căn cứ tính tổng điểm AI.',limitations:['Đây là bộ quy tắc hỗ trợ chấm sơ bộ, chưa được đánh giá bằng điểm giảng viên độc lập.','Mức tự động tối đa 3/4 cho tiêu chí nội dung; không khẳng định chất lượng sản phẩm chỉ vì có từ khóa.','Không thực thi mã hoặc truy cập liên kết trong báo cáo; không tự công bố điểm chính thức.',...(semantic.coverage?.truncated?['BERT giới hạn số đoạn truy xuất; bộ quy tắc dùng phần văn bản đã đọc và giữ trích đoạn nguồn, cần kiểm tra bản đầy đủ.']:[])],confidence:null,confidenceStatus:'NOT_CALIBRATED'};
}
module.exports={VERSION,score,normalize,sections};
