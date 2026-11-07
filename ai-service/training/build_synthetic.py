"""Original Vietnamese synthetic reports; no crawling or copied student records."""
import hashlib
import argparse
import json
import random
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'datasets' / 'synthetic-internship-v1'
REFERENCES = ['https://research.stem.open.ac.uk/ouanalyse/dataset/',
              'https://pmc.ncbi.nlm.nih.gov/articles/PMC5704676/']
SCENARIOS = [
    ('steady', 'on_track', 'Các đầu việc đang theo lịch đã thống nhất. Tôi đã nộp bản thiết kế và cập nhật góp ý vào tài liệu.', 'Tiếp tục hoàn thiện chức năng và kiểm thử các dữ liệu không hợp lệ.'),
    ('blocked', 'needs_support', 'Tôi chưa tích hợp được API vì chưa thống nhất cấu trúc phản hồi. Đã thử đọc tài liệu nhưng vẫn gặp lỗi khi xử lý quyền.', 'Cần một buổi cùng người hướng dẫn rà lại hợp đồng API và chia nhỏ công việc.'),
    ('overdue', 'needs_support', 'Một số đầu việc đã qua hạn trong khi giao diện vẫn thiếu chức năng chính. Tôi chưa có lịch điều chỉnh được xác nhận.', 'Đề nghị rà soát khối lượng, chốt thứ tự ưu tiên và thống nhất lại thời hạn.'),
    ('hours_pending', 'on_track', 'Công việc đã được bàn giao đúng lịch. Phiên giờ làm còn chờ doanh nghiệp duyệt nên tổng phút được duyệt chưa thể hiện đủ thời gian.', 'Theo dõi yêu cầu duyệt giờ, không kết luận thiếu hoạt động chỉ từ số giờ chưa duyệt.'),
    ('unclear_report', 'needs_support', 'Báo cáo tuần này mới liệt kê tên công việc, chưa mô tả sản phẩm bàn giao hoặc cách kiểm tra kết quả. Tôi chưa biết ghi bằng chứng như thế nào.', 'Cần hướng dẫn cách ghi nhật ký, mô tả sản phẩm và bổ sung minh chứng kiểm thử.'),
    ('resolved', 'on_track', 'Sau buổi trao đổi, nguyên nhân lỗi đã được xác định và phương án xử lý được người hướng dẫn chấp thuận. Các công việc tiếp theo có lịch rõ ràng.', 'Thực hiện kế hoạch đã thống nhất và báo ngay nếu vấn đề xuất hiện lại.'),
    ('missing_contact', 'needs_support', 'Tôi chưa nhận được phản hồi về yêu cầu thay đổi nên hai đầu việc phụ thuộc chưa thực hiện được. Chưa xác định người có thể hỗ trợ.', 'Nhờ giảng viên kết nối đầu mối doanh nghiệp và thống nhất lịch trao đổi.'),
    ('testing', 'on_track', 'Đã hoàn thành phần triển khai theo phạm vi tuần. Các trường hợp kiểm thử đang được ghi lại và lỗi phát hiện đã có người phụ trách.', 'Tiếp tục đối chiếu tiêu chí nghiệm thu và chuẩn bị tài liệu bàn giao.'),
]
TOPICS = ['website bán hàng', 'quản lý kho', 'quản lý nhân sự', 'cổng tuyển dụng',
          'đặt lịch dịch vụ', 'quản lý thư viện', 'dashboard doanh thu', 'quản lý đào tạo']

def build(student_count=120):
    if student_count < 40 or student_count % 20:
        raise ValueError('Student count must be at least 40 and a multiple of 20')
    rng = random.Random(20261107)
    rows = []
    # Stratified deterministic student split: every scenario appears in every split.
    for student in range(student_count):
        scenario, label, observation, plan = SCENARIOS[student % 8]
        split = 'train' if student < student_count * 3 // 5 else 'validation' if student < student_count * 4 // 5 else 'test'
        topic = rng.choice(TOPICS)
        for week in [2, 4]:
            total = rng.randint(5, 12)
            done = rng.randint(1, total - 1)
            overdue = rng.randint(1, 3) if scenario == 'overdue' else 0
            done = min(done, total - overdue)
            approved = 0 if scenario == 'hours_pending' else rng.randint(2, 12) * 60
            # Features are observations at report time, never final grades or future outcomes.
            features = dict(total_tasks=total, done_tasks=done, overdue_tasks=overdue,
                            open_sessions=rng.choice([0, 0, 1]), approved_minutes=approved,
                            report_versions=rng.randint(1, 3))
            detail = rng.choice(['xử lý dữ liệu đầu vào', 'phân quyền theo vai trò', 'thiết kế bộ lọc tìm kiếm',
                                 'hiển thị lỗi biểu mẫu', 'tối ưu truy vấn', 'viết tài liệu API'])
            text = '\n\n'.join([
                f'Báo cáo thực tập tuần {week}: {topic}.',
                f'Mục tiêu: khảo sát yêu cầu và phát triển {topic}; trọng tâm kỳ báo cáo là {detail}.',
                f'Công việc: thiết kế dữ liệu, xây dựng API và giao diện. Trong {total} đầu việc đã ghi nhận, {done} công việc hoàn tất tại thời điểm nộp.',
                'Tiến độ và khó khăn: ' + observation,
                f'Kết quả cần đối chiếu: tài liệu yêu cầu, bản thiết kế và các trường hợp kiểm thử về {detail}. Bản ghi này không đính kèm sản phẩm đã xác minh.',
                f'Thời gian: hệ thống đang ghi nhận {approved} phút đã duyệt. Cần đối chiếu các phiên còn chờ trước khi kết luận về tổng thời gian.',
                'Kế hoạch tiếp theo: ' + plan,
                f'Ghi chú học tập: lần ghi nhận {student + 1}, tuần {week}; cần phân biệt kết quả thực hiện với kế hoạch dự kiến.',
            ])
            rows.append(dict(id=f'SYN-{student:03d}-W{week}', student_id=f'SYN-{student:03d}',
                             split=split, synthetic=True, label_source='scenario-generator-not-expert',
                             scenario=scenario, label=label, report_text=text,
                             features=features, label_rationale=observation + ' ' + plan))
    return rows

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--students', type=int, default=120)
    parser.add_argument('--name', choices=['synthetic-internship-v1','synthetic-internship-v2'], default='synthetic-internship-v1')
    args = parser.parse_args()
    rows = build(args.students)
    target = ROOT / 'datasets' / args.name
    target.mkdir(parents=True, exist_ok=False)
    payload = ''.join(json.dumps(row, ensure_ascii=False) + '\n' for row in rows)
    (target / 'reports.jsonl').write_bytes(payload.encode('utf8'))
    manifest = dict(dataset=args.name, synthetic=True, human_annotated=False,
                    intended_use='offline-pipeline-demonstration-only', real_world_acceptance=False,
                    source='original-scenario-generator', structural_references=REFERENCES,
                    references_are_not_source_records=True, students=args.students, reports=len(rows),
                    splits=dict(Counter(r['split'] for r in rows)),
                    labels=dict(Counter(r['label'] for r in rows)),
                    sha256=hashlib.sha256(payload.encode()).hexdigest(),
                    limitations=['Labels authored by generator, not teachers.',
                                 'Scenario templates overlap across splits; student isolation is not independent-domain evaluation.',
                                 'No CV data and no real internship outcome labels.',
                                 'Must not promote to production or claim quality on real students.'])
    (target / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf8')
    print(json.dumps({k: manifest[k] for k in ['dataset', 'students', 'reports', 'splits', 'labels']}))

if __name__ == '__main__':
    main()
