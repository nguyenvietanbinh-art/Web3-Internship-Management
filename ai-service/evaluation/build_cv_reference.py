"""Original synthetic CVs and reproducible reference judgments, not expert labels."""
import argparse
import csv
import hashlib
import json
from collections import Counter
from pathlib import Path

TRACKS = [
 ('frontend','Phát triển giao diện web',['HTML','CSS','JavaScript','React','Git'],'giao diện quản lý đơn hàng','xây dựng biểu mẫu, danh sách và xử lý lỗi nhập liệu'),
 ('backend','Phát triển API Node.js',['JavaScript','Node.js','Express','MongoDB','Git'],'API quản lý lịch hẹn','thiết kế API, kiểm tra đầu vào và phân quyền người dùng'),
 ('java','Phát triển ứng dụng Java',['Java','Spring Boot','SQL','MySQL','Git'],'hệ thống mượn sách','xây dựng nghiệp vụ mượn trả, API và truy vấn dữ liệu'),
 ('qa','Kiểm thử phần mềm',['Manual Testing','Test Cases','Postman','SQL','Git'],'kiểm thử website đăng ký học phần','thiết kế ca kiểm thử, tái hiện lỗi và kiểm tra API'),
 ('data','Phân tích dữ liệu',['Python','SQL','Pandas','Excel','Power BI'],'bảng phân tích doanh thu tổng hợp','làm sạch dữ liệu, viết truy vấn và giải thích biểu đồ'),
 ('mobile','Lập trình Android',['Kotlin','Android','REST API','SQLite','Git'],'ứng dụng ghi chép chi tiêu','thiết kế màn hình, lưu dữ liệu và xử lý lỗi kết nối'),
 ('devops','Vận hành ứng dụng',['Linux','Docker','Git','CI/CD','Networking'],'môi trường chạy ứng dụng nội bộ','đóng gói ứng dụng, viết quy trình triển khai và theo dõi log'),
 ('security','An toàn ứng dụng web',['Linux','Networking','OWASP','Python','HTTP'],'kiểm tra bảo mật ứng dụng thử nghiệm','kiểm tra phân quyền và xác thực trong phạm vi được phép'),
 ('nlp','Xử lý ngôn ngữ',['Python','Pandas','NLP','scikit-learn','SQL'],'phân loại phản hồi tổng hợp','chuẩn hóa văn bản, chia tập dữ liệu và phân tích trường hợp sai'),
 ('blockchain','Lập trình hợp đồng thông minh',['JavaScript','Solidity','Hardhat','ethers.js','Git'],'hợp đồng ghi nhận bằng chứng trên mạng local','viết kiểm thử quyền, đọc sự kiện và kiểm tra receipt'),
]
PROVENANCE='synthetic-rubric-reference-not-independent-expert'

def judge(cv,jd):
    matched=sorted(set(cv['skills'])&set(jd['required_skills']))
    missing=sorted(set(jd['required_skills'])-set(cv['skills']))
    coverage=len(matched)/len(jd['required_skills'])
    same=cv['track']==jd['track']
    project=same and cv['project_evidence']>0
    parts={'required_skills':round(40*coverage,2),
           'project_description':(35 if cv['project_evidence']==2 else 18) if project else 0,
           'domain_alignment':15 if same else 0,
           'availability':10 if cv['days_per_week']>=jd['days_per_week'] else 0}
    score=round(sum(parts.values()),2)
    grade=3 if score>=75 and coverage>=.75 and project else 2 if score>=55 and coverage>=.5 and project else 1 if score>=30 else 0
    return dict(cv_id=cv['id'],jd_id=jd['id'],score=score,grade=grade,parts=parts,matched_skills=matched,missing_skills=missing,
                rationale=f"Đáp ứng {len(matched)}/{len(jd['required_skills'])} kỹ năng khai báo. "+
                ('Bài tập cùng hướng; mô tả có cách thực hiện và tự kiểm tra. ' if project and cv['project_evidence']==2 else 'Bài tập cùng hướng nhưng căn cứ còn ít. ' if project else 'Chưa có mô tả bài tập đúng hướng để đối chiếu. ')+
                ('Lịch tham gia đáp ứng yêu cầu.' if parts['availability'] else 'Lịch tham gia chưa đáp ứng yêu cầu.'),
                recommendation=['Chưa phù hợp','Cần bổ sung yêu cầu trọng yếu','Phù hợp phần lớn, cần trao đổi thêm','Phù hợp trực tiếp trên thông tin khai báo'][grade],
                verified_ability=False,human_confirmed=False,label_source=PROVENANCE)

def build():
    cvs=[];jds=[]
    for ti,(track,title,skills,project,duties) in enumerate(TRACKS):
        for option in range(2):
            required=skills[:4] if option==0 else skills[1:]
            text=f"{title} — {'Nghiệp vụ cơ bản' if option==0 else 'Tích hợp và kiểm thử'}. Nhiệm vụ: {duties}. Yêu cầu: {', '.join(required)}. Ưu tiên mô tả được bài tập đã thực hiện, biết phối hợp nhóm, chủ động báo khó khăn và ghi lại cách kiểm tra. Làm việc {3+option} ngày mỗi tuần trong 12 tuần. Chấp nhận sinh viên chưa có kinh nghiệm doanh nghiệp; không xem các phẩm chất tự khai là đã xác minh."
            jds.append(dict(id=f'JD-{ti+1:02d}-{option+1}',track=track,title=title,required_skills=required,days_per_week=3+option,text=text,synthetic=True))
        for variant in range(20):
            family=variant//4;level=variant%4
            chosen=skills[:[2,3,4,5][level]]
            # Cross-domain skills create partially relevant alternatives without inflating ability.
            if variant%3==0:chosen=list(dict.fromkeys(chosen+TRACKS[(ti+1)%10][2][:2]))
            evidence=[0,1,2,2][level];days=[2,3,4,4][level]
            cv_id=f'CV-{ti*20+variant+1:03d}'
            name=f'Sinh viên hồ sơ {ti*20+variant+1:03d}'
            experience=(f"Bài tập học phần: {project}. Phần trực tiếp thực hiện: {duties}. "
                        +(f"Tự kiểm tra bằng dữ liệu đầu vào hợp lệ và không hợp lệ; ghi lại lỗi và sửa từng bước. Khó khăn: cần thống nhất đầu vào khi phối hợp bạn cùng nhóm. Chưa có đường dẫn hoặc tài liệu để kiểm chứng ngoài mô tả." if evidence==2 else 'Mới có bản nháp, chưa mô tả được kết quả kiểm thử hoặc phần đóng góp chi tiết.')) if evidence else 'Đã học kiến thức cơ sở; chưa có bài tập hoàn chỉnh đúng hướng để trình bày. Không khai đã hoàn thành sản phẩm.'
            text=f"{name}\nMục tiêu: thực tập {title.lower()}, làm phần việc vừa sức và tiếp thu phản hồi.\nHọc vấn: sinh viên Công nghệ thông tin; GPA {2.3+level*.3+family*.04:.2f}/4, giá trị mẫu không được xác minh.\nKỹ năng đã học và tự khai: {', '.join(chosen)}. Mức độ: {'cơ bản' if level<2 else 'đã áp dụng trong bài tập học phần'}.\nKinh nghiệm và bài tập: {experience}\nPhối hợp: chủ động ghi việc cần làm, hỏi khi chưa rõ yêu cầu; chưa có đánh giá phẩm chất từ đơn vị thực tập.\nThời gian: {days} ngày/tuần trong 12 tuần. Mong muốn được hướng dẫn, không có kinh nghiệm làm việc chính thức.\nLiên hệ mẫu: cv{ti*20+variant+1:03d}@example.invalid. Hồ sơ tổng hợp để kiểm thử, không phải người thật."
            cvs.append(dict(id=cv_id,name=name,student_code=f'2699{ti*20+variant+1:06d}',track=track,skills=chosen,project_evidence=evidence,days_per_week=days,text=text,
                            group_id=f'{track}-family-{family}',split='train' if family<3 else 'validation' if family==3 else 'test',synthetic=True))
    judgments=[judge(cv,jd) for cv in cvs for jd in jds]
    return cvs,jds,judgments

def write_dataset(output):
    allowed=Path(__file__).resolve().parents[1]/'datasets';output=output.resolve()
    if allowed not in output.parents:raise ValueError('Output must be a new directory under ai-service/datasets')
    if output.exists():raise FileExistsError('Refuse to replace an existing dataset')
    cvs,jds,judgments=build();output.mkdir(parents=True);(output/'cvs').mkdir();(output/'reviews').mkdir()
    def save(name,rows):
        with (output/name).open('x',encoding='utf8') as f:
            for row in rows:f.write(json.dumps(row,ensure_ascii=False)+'\n')
    save('cvs.jsonl',cvs);save('jobs.jsonl',jds);save('reference-judgments.jsonl',judgments)
    for cv in cvs:
        (output/'cvs'/f"{cv['id']}.md").write_text('# '+cv['id']+'\n\n'+cv['text']+'\n',encoding='utf8')
        rows=sorted((r for r in judgments if r['cv_id']==cv['id']),key=lambda r:(-r['score'],r['jd_id']))
        lines=[f"# Phiếu đối chiếu {cv['id']}",'','Nguồn: dữ liệu tổng hợp, chấm theo quy tắc tham chiếu; chưa có người đánh giá xác nhận.','']
        for r in rows:lines.extend([f"## {r['jd_id']} — {r['recommendation']}",f"Điểm tham chiếu: {r['score']}/100; mức phù hợp {r['grade']}/3.",r['rationale'],f"Kỹ năng cần bổ sung: {', '.join(r['missing_skills']) or 'Không thiếu theo danh sách khai báo'}.",''])
        (output/'reviews'/f"{cv['id']}.md").write_text('\n'.join(lines),encoding='utf8')
    with (output/'human-review.csv').open('x',encoding='utf-8-sig',newline='') as f:
        writer=csv.writer(f);writer.writerow(['cv_id','jd_id','reviewer_id','human_grade_0_to_3','reason','reviewed_at'])
        writer.writerows([r['cv_id'],r['jd_id'],'','','',''] for r in judgments)
    hashes={p.relative_to(output).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(output.rglob('*')) if p.is_file()}
    manifest=dict(dataset='cv-jd-reference-200-v1',provenance=PROVENANCE,synthetic=True,expert_confirmed=False,cv_count=len(cvs),jd_count=len(jds),pairs=len(judgments),splits=dict(Counter(c['split'] for c in cvs)),grade_distribution=dict(Counter(r['grade'] for r in judgments)),binary_relevant_min_grade=2,
                  use='Scenario benchmark and human review preparation; not real-world accuracy or training an independent labeler',
                  limitations=['CV/JD text and labels share generation rules; strong construction bias.','CV families grouped, but templates and job catalog shared across splits.','Self-reported skills, GPA and projects are not independently verified.','Reference points are not calibrated probabilities or official grades.'],sha256=hashes)
    (output/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
    return manifest

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output',required=True);args=parser.parse_args()
    result=write_dataset(Path(args.output));print(json.dumps({k:v for k,v in result.items() if k!='sha256'},ensure_ascii=False))
