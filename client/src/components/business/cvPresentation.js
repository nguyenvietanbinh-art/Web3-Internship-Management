// Keep generated provenance in stored CVs and exports; omit it from form copy.
const sourceNote='Nguồn: tình huống học tập tổng hợp để đối chiếu CV với yêu cầu công việc; không phải kinh nghiệm làm việc hoặc thành tích của người thật.';
export function cvDisplayText(value) {
  return typeof value==='string'?value.split(/\r?\n/).filter(line=>line.trim()!==sourceNote).join('\n'):value;
}
export function preserveCvSource(edited,original) {
  if(typeof original!=='string'||!original.split(/\r?\n/).some(line=>line.trim()===sourceNote))return edited;
  return `${cvDisplayText(edited)||''}\n${sourceNote}`;
}
