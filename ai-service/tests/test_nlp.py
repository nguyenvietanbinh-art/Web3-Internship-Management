import math
import unittest
from fastapi.testclient import TestClient
from main import app
from nlp.schemas import RankingRequest, ReportRequest
from nlp.engine import rank, normalize, skills, NotReady, encoder
from nlp.metrics import ranking_metrics, validate_dataset
from nlp.risk import analyze

class NlpTests(unittest.TestCase):
    def test_unicode_and_skills(self):
        self.assertEqual(normalize('  Lập\n trình\x00 '),'Lập trình');self.assertEqual(skills(['JS','javascript','ReactJS']),['javascript','react'])
    def test_real_tfidf_ranking(self):
        r=rank(RankingRequest(query={'id':'q','text':'React Solidity developer'},candidates=[{'id':'b','text':'kế toán tài chính'},{'id':'a','text':'React Solidity developer'}],engine='tfidf'))
        self.assertEqual(r['results'][0]['id'],'a');self.assertAlmostEqual(r['results'][0]['cosine'],1);self.assertEqual(r['results'][1]['cosine'],0);self.assertIsNone(r['confidence'])
    def test_empty_and_duplicate(self):
        with self.assertRaises(ValueError):rank(RankingRequest(query={'id':'q','text':' '},candidates=[],engine='tfidf'))
        with self.assertRaises(ValueError):rank(RankingRequest(query={'id':'q','text':'React'},candidates=[{'id':'a','text':'x'},{'id':'a','text':'y'}],engine='tfidf'))
    def test_empty_pool_and_negative_shape(self):
        self.assertEqual(rank(RankingRequest(query={'id':'q','text':'React'},candidates=[],engine='tfidf'))['results'],[])
        self.assertEqual(TestClient(app).post('/api/v1/nlp/rank',json={'query':{'id':'q','text':'x'},'candidates':[],'top_k':True}).status_code,422)
    def test_formula_hand_calculated_not_quality(self):
        r=ranking_metrics(['a','b','c'],{'a':3,'b':0,'c':1},2)
        self.assertEqual(r['precision_at_k'],.5);self.assertEqual(r['recall_at_k'],.5);self.assertAlmostEqual(r['average_precision'],5/6);self.assertAlmostEqual(r['ndcg_at_k'],7/(7+1/math.log2(3)))
    def test_metrics_reject_unjudged_duplicate_and_empty_relevance(self):
        for ranking,labels in [(['x'],{'a':1}),(['a','a'],{'a':1}),(['a'],{'a':0}),(['a'],{'a':float('nan')})]:
            with self.assertRaises(ValueError):ranking_metrics(ranking,labels,1)
    def test_dataset_requires_real_provenance(self):
        with self.assertRaises(ValueError):validate_dataset({'provenance':'synthetic-test-fixture'})
    def test_group_and_text_leakage(self):
        row={'id':'q','group_id':'g','query':{'id':'q','text':'unique'},'candidates':[{'id':'a','text':'React'}],'labels':{'a':1}}
        data={'provenance':'independent-human-judgments','consent':'UNIT-ONLY','annotators':['UNIT'],'splits':{'train':[row],'test':[row]}}
        with self.assertRaises(ValueError):validate_dataset(data)
    def test_report_rules_are_not_classifier(self):
        r=analyze(ReportRequest(content='Đã lập trình React',criteria='React',engine='tfidf',total_tasks=2,overdue_tasks=1,open_sessions=1))
        self.assertEqual(r['rule_alert_level'],'review');self.assertEqual(r['classifier']['status'],'NOT_TRAINED');self.assertIsNone(r['classifier']['confidence']);self.assertEqual(r['semantic_relevance']['engine'],'tfidf')
    def test_report_empty_and_inconsistent_counts(self):
        for r in [ReportRequest(content=' ',criteria='React',engine='tfidf'),ReportRequest(content='React',criteria='',engine='tfidf',done_tasks=2,total_tasks=1)]:
            with self.assertRaises(ValueError):analyze(r)
    def test_api_validation_and_status(self):
        c=TestClient(app);self.assertEqual(c.get('/api/v1/nlp/status').json()['risk_classifier'],'NOT_TRAINED');self.assertEqual(c.post('/api/v1/nlp/rank',json={'secret':'no'}).status_code,422)
    def test_http_body_limit(self):
        r=TestClient(app).post('/api/v1/nlp/rank',content=b' '*(4*1024*1024+1),headers={'Content-Type':'application/json'})
        self.assertEqual(r.status_code,413)
    def test_no_implicit_download_or_fake_sbert(self):
        from unittest.mock import patch
        from nlp.engine import LocalEncoder
        with patch('nlp.engine.encoder',LocalEncoder()),patch.dict('os.environ',{'NLP_MODEL_DIR':''}):
            c=TestClient(app);r=c.post('/api/v1/nlp/rank',json={'query':{'id':'q','text':'React'},'candidates':[{'id':'a','text':'React'}],'engine':'sbert'})
            self.assertEqual(r.status_code,503)
            self.assertEqual(r.json()['detail'],'LOCAL_MODEL_NOT_CONFIGURED')
    def test_model_load_refuses_low_memory_before_import_or_network(self):
        from unittest.mock import patch
        from nlp.engine import LocalEncoder
        with patch.dict('os.environ',{'NLP_MODEL_DIR':'TEST_ONLY_NONEXISTENT'}),patch('nlp.engine.available_mib',return_value=100):
            with self.assertRaisesRegex(NotReady,'INSUFFICIENT_MEMORY'):LocalEncoder().load()
    def test_model_download_requires_approval_and_isolated_path(self):
        from evaluation.download_model import download
        with self.assertRaises(ValueError):download('TEST_NO_WRITE',False)
        with self.assertRaises(ValueError):download('TEST_NO_WRITE',True)
    def test_metrics_boundaries_and_boolean_grade_rejected(self):
        self.assertEqual(ranking_metrics(['a'],{'a':1},1)['average_precision'],1)
        with self.assertRaises(ValueError):ranking_metrics(['a'],{'a':True},1)

if __name__=='__main__':unittest.main()
