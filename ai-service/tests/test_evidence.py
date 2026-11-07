import unittest
from nlp.schemas import EvidenceRequest
from nlp.evidence import analyze_evidence

class EvidenceTests(unittest.TestCase):
    def test_quotes_are_exact_and_claims_are_not_verified(self):
        content = 'Đã hoàn thành API đăng nhập.\nChưa kiểm thử mã hóa mật khẩu.'
        result = analyze_evidence(EvidenceRequest(content=content, criteria=[{'id':'login','text':'API đăng nhập'},{'id':'hash','text':'mã hóa mật khẩu'}], engine='tfidf'))
        for criterion in result['criteria']:
            self.assertFalse(criterion['verified'])
            self.assertNotEqual(criterion['proposed_status'], 'met')
            for match in criterion['matches']:
                self.assertEqual(content[match['start']:match['end']],match['quote'])
        self.assertIsNone(result['score'])
        self.assertIsNone(result['official_progress'])

    def test_missing_evidence_and_related_attachment_are_distinct(self):
        result = analyze_evidence(EvidenceRequest(content='Thiết kế giao diện',criteria=[{'id':'db','text':'MongoDB database schema'},{'id':'unknown','text':'Astronomy telescope galaxy'}],attachments=[{'id':'file','text':'MongoDB database schema'}],engine='tfidf'))
        self.assertEqual(result['criteria'][0]['evidence_state'],'related_evidence')
        self.assertEqual(result['criteria'][1]['evidence_state'],'insufficient')
        self.assertFalse(result['verified'])

    def test_coverage_is_explicit_and_duplicate_ids_fail(self):
        result=analyze_evidence(EvidenceRequest(content=('API login\n'*50),criteria=[{'id':'a','text':'API login'}],engine='tfidf'))
        self.assertTrue(result['coverage']['truncated'])
        self.assertEqual(result['coverage']['passages_used'],40)
        with self.assertRaises(ValueError):
            analyze_evidence(EvidenceRequest(content='login',criteria=[{'id':'a','text':'one'},{'id':'a','text':'two'}],engine='tfidf'))
