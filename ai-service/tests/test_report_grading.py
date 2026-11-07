import unittest
from nlp.schemas import ReportRequest
from nlp.report_grading import propose

class ProvisionalGradingTests(unittest.TestCase):
    def test_draft_is_not_official_and_never_exceeds_weights(self):
        r=propose(ReportRequest(content='Mục tiêu: phát triển website.',criteria=''))
        self.assertFalse(r['official']);self.assertEqual(r['status'],'PROPOSED_NOT_APPROVED')
        self.assertEqual(sum(i['max'] for i in r['criteria']),100)
        self.assertEqual(r['total'],round(sum(i['score'] for i in r['criteria']),2))
        self.assertTrue(all(0<=i['score']<=i['max'] and i['requires_review'] for i in r['criteria']))

    def test_fuller_content_scores_above_brief_but_evidence_not_verified(self):
        brief=propose(ReportRequest(content='Em đã làm website.',criteria=''))
        text=('1. Mục tiêu, yêu cầu, phạm vi.\n2. Phân tích, thiết kế, phương pháp và công nghệ.\n'
              '3. Kết quả chức năng đáp ứng yêu cầu bàn giao.\n4. Kiểm thử, trường hợp, bằng chứng và tài liệu.\n'
              '5. Nhật ký.\n6. Khó khăn, giải pháp, bài học, kế hoạch.\n7. Nguồn tham khảo và tự đánh giá.')
        full=propose(ReportRequest(content=text+' Nội dung minh họa.'*20,criteria='',total_tasks=4,done_tasks=4,approved_minutes=480))
        self.assertGreater(full['total'],brief['total'])
        evidence=next(i for i in full['criteria'] if i['id']=='evidence')
        self.assertEqual(evidence['score'],10)

    def test_semantic_engine_does_not_change_score(self):
        content='Mục tiêu, phạm vi, yêu cầu và công nghệ.'
        self.assertEqual(propose(ReportRequest(content=content,criteria='',engine='sbert')),propose(ReportRequest(content=content,criteria='',engine='tfidf')))

    def test_unfinished_product_caps_results(self):
        r=propose(ReportRequest(content=('Kết quả sản phẩm chưa hoàn thành chức năng để bàn giao, cần đối chiếu yêu cầu. '*10),criteria=''))
        self.assertLessEqual(next(i['score'] for i in r['criteria'] if i['id']=='results'),12.5)

    def test_absent_sections_list_does_not_earn_points(self):
        r=propose(ReportRequest(content='Các phần chưa có: phân tích, thiết kế, phương pháp, công nghệ, kiểm thử, bằng chứng và tài liệu.',criteria=''))
        self.assertEqual(next(i['score'] for i in r['criteria'] if i['id']=='method'),0)
        self.assertEqual(next(i['score'] for i in r['criteria'] if i['id']=='evidence'),0)

if __name__=='__main__':
    unittest.main()
