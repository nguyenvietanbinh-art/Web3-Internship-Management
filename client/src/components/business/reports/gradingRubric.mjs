import defaultRubric from '../../../../../shared/report-rubric.json' with {type:'json'};
export const REPORT_RUBRIC=defaultRubric.criteria;

export function rubricTotal(scores,criteria=REPORT_RUBRIC) {
  let cents=0;
  for(const item of criteria){
    const raw=String(scores[item.id]??'').trim();
    if(!/^\d+(\.\d{1,2})?$/.test(raw))throw new Error('Hãy nhập điểm cho đủ 7 tiêu chí; không tự cho điểm khi chưa có căn cứ.');
    const n=Number(raw);
    if(!Number.isFinite(n)||n<0||n>item.max)throw new Error(`Điểm ${item.label.toLowerCase()} phải từ 0 đến ${item.max}.`);
    cents+=Math.round(n*100);
  }
  return cents/100;
}

export function rubricComment(scores,notes,comment,criteria=REPORT_RUBRIC) {
  const total=rubricTotal(scores,criteria);
  if(!comment.trim())throw new Error('Hãy ghi nhận xét và phần sinh viên cần bổ sung.');
  const lines=criteria.map(item=>{
    const note=String(notes[item.id]||'').trim();
    if(note.length>250)throw new Error('Nhận xét mỗi tiêu chí tối đa 250 ký tự.');
    return `${item.label}: ${scores[item.id]}/${item.max}${note?' — '+note:''}`;
  });
  const text=['PHIẾU CHẤM BÁO CÁO THỰC TẬP',...lines,`Tổng điểm: ${total}/100`,`NHẬN XÉT VÀ YÊU CẦU BỔ SUNG\n${comment.trim()}`].join('\n');
  if(text.length>5000)throw new Error('Phiếu chấm vượt quá độ dài cho phép. Hãy rút gọn nhận xét.');
  return text;
}
