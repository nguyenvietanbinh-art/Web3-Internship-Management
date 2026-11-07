"""Transparent provisional completeness grading; never an official evaluation."""
import re

def propose(req):
    raw=req.content.casefold()
    # A list explicitly saying sections are absent must not earn completeness points.
    text=re.sub(r'các phần chưa có:[^\n]*','',raw)
    text=re.sub(r'chưa (?:có|trình bày|mô tả|nêu|bổ sung)[^.\n]*','',text)
    length=len(req.content.strip())
    items=[]
    def add(key,label,maximum,patterns,cap=None):
        found=sum(bool(re.search(pattern,text)) for pattern in patterns)
        score=round(maximum*found/len(patterns),2)
        if length<300:
            score=round(score*.5,2)
        if cap is not None:
            score=min(score,cap)
        items.append(dict(id=key,label=label,max=maximum,score=score,
                          basis=f'Nhận diện {found}/{len(patterns)} nhóm nội dung cần trình bày; chưa xác minh tính đúng đắn.',
                          requires_review=True))
    add('goals','Mục tiêu và yêu cầu đề tài',10,[r'mục tiêu',r'yêu cầu',r'phạm vi'])
    add('method','Phân tích và cách thực hiện',20,[r'phân tích',r'thiết kế',r'phương pháp|cách thực hiện',r'giải pháp|công nghệ'])
    unfinished=bool(re.search(r'chưa (?:hoàn thành|có sản phẩm|triển khai)|thiếu chức năng',raw))
    add('results','Kết quả và mức độ hoàn thành',25,[r'kết quả|sản phẩm',r'bàn giao',r'đối chiếu|đáp ứng',r'chức năng|công việc'],cap=12.5 if unfinished else None)
    add('evidence','Kiểm thử và bằng chứng',20,[r'kiểm thử',r'trường hợp|kịch bản',r'bằng chứng|minh chứng',r'tài liệu|đính kèm'],cap=10)
    done_ratio=req.done_tasks/req.total_tasks if req.total_tasks else 0
    progress=round(6*done_ratio+(2 if req.approved_minutes>0 else 0)+(2 if 'nhật ký' in text else 0),2)
    items.append(dict(id='progress',label='Tiến độ và quá trình thực tập',max=10,score=progress,
                      basis=f'Đã hoàn thành {req.done_tasks}/{req.total_tasks} công việc, có {req.approved_minutes} phút được duyệt. Chưa đánh giá chất lượng công việc.',requires_review=True))
    add('reflection','Khó khăn, bài học và cải tiến',10,[r'khó khăn',r'giải pháp|biện pháp',r'bài học|kinh nghiệm',r'kế hoạch|cải tiến'])
    add('presentation','Trình bày và nguồn tài liệu',5,[r'(?:^|\n)\s*\d+[.)]',r'nguồn|tham khảo',r'kết luận|tự đánh giá|tổng kết'])
    total=round(sum(item['score'] for item in items),2)
    return dict(status='PROPOSED_NOT_APPROVED',total=total,max_score=100,criteria=items,
                method='content-completeness-and-observed-progress',official=False,
                summary='Điểm chấm trước dựa trên các mục được nhắc đến và dữ liệu tiến độ; chưa phải điểm được giảng viên xác nhận.',
                limitations=['Cần đọc bài để kiểm tra nội dung có đúng và đáp ứng yêu cầu hay không.',
                             'Chỉ tạm tính tối đa 10/20 điểm bằng chứng vì chưa mở và xác minh sản phẩm, tài liệu đính kèm.',
                             'Không lấy kết quả đối chiếu nội dung hoặc gợi ý hỗ trợ để tự cộng, trừ điểm.'])
