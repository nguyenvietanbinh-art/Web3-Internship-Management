from .schemas import Document, RankingRequest
from .engine import rank

def analyze(req):
    if not req.content.strip():
        raise ValueError('Report content is empty')
    if req.done_tasks > req.total_tasks or req.overdue_tasks > req.total_tasks:
        raise ValueError('Inconsistent task counts')
    factors = []
    if req.overdue_tasks:
        factors.append({'code':'OVERDUE_TASKS','source':'rule','observed':req.overdue_tasks,'description':'Task chưa hoàn tất và đã quá deadline tại thời điểm phân tích.'})
    if req.open_sessions:
        factors.append({'code':'MISSING_CHECKOUT','source':'rule','observed':req.open_sessions,'description':'Phiên giờ làm chưa checkout; cần kiểm tra thủ công, không suy thành vắng mặt.'})
    if not req.approved_minutes:
        factors.append({'code':'NO_APPROVED_HOURS','source':'rule','observed':0,'description':'Chưa có phút đã duyệt; có thể do chưa bắt đầu/chưa được duyệt, không kết luận vi phạm.'})
    semantic = None
    if req.criteria.strip():
        semantic = rank(RankingRequest(query=Document(id='criteria',text=req.criteria),candidates=[Document(id='report',text=req.content)],engine=req.engine,top_k=1))
    return {'rule_alert_level':'review' if factors else 'no_observed_rule_alert','rule_factors':factors,'semantic_relevance':semantic,'classifier':{'status':'NOT_TRAINED','risk_prediction':None,'confidence':None,'reason':'Chưa có tập báo cáo được chuyên gia gán nhãn, chưa huấn luyện/hiệu chuẩn classifier.'},'observations':{'total_tasks':req.total_tasks,'done_tasks':req.done_tasks,'approved_minutes':req.approved_minutes,'report_versions':req.report_versions},'decision':'Hỗ trợ người hướng dẫn xem xét; không quyết định kỷ luật hoặc tự chấm điểm.'}
