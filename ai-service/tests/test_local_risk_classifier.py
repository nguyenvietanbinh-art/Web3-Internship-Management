import hashlib
import json
import os
import unittest
from pathlib import Path
from unittest.mock import patch
from nlp.risk_classifier import predict,status
from nlp.schemas import ReportRequest

ROOT=Path(__file__).resolve().parents[2]
BASE=ROOT/'contracts/node_modules/.cache/risk-training-20261107/tfidf-1000'

class ClassifierSafetyTests(unittest.TestCase):
    def test_disabled_without_explicit_flag(self):
        with patch.dict(os.environ,{'NLP_ALLOW_SYNTHETIC_CLASSIFIER':'false'}):
            self.assertEqual(status()['status'],'NOT_TRAINED')

    def test_bad_hash_never_returns_prediction(self):
        with patch.dict(os.environ,{'NLP_ALLOW_SYNTHETIC_CLASSIFIER':'true','NLP_RISK_MODEL_FILE':str(BASE/'local-classifier.json'),'NLP_RISK_MODEL_SHA256':'0'*64}):
            r=predict(ReportRequest(content='Báo cáo thử',criteria=''))
            self.assertEqual(r['status'],'UNAVAILABLE');self.assertIsNone(r['risk_prediction'])

@unittest.skipUnless((BASE/'local-classifier.json').exists(),'Local trained artifact not packaged; no fake replacement')
class RealArtifactTests(unittest.TestCase):
    def setUp(self):
        path=BASE/'local-classifier.json'
        self.env={'NLP_ALLOW_SYNTHETIC_CLASSIFIER':'true','NLP_RISK_MODEL_FILE':str(path),'NLP_RISK_MODEL_SHA256':hashlib.sha256(path.read_bytes()).hexdigest()}

    def test_serving_reproduces_heldout_experiment_confusion_matrix(self):
        from sklearn.metrics import confusion_matrix
        rows=[json.loads(line) for line in (ROOT/'ai-service/datasets/synthetic-internship-v2/reports.jsonl').read_text(encoding='utf8').splitlines()]
        test=[r for r in rows if r['split']=='test']
        predictions=[]
        with patch.dict(os.environ,self.env):
            for row in test:
                result=predict(ReportRequest(content=row['report_text'],criteria='',**row['features']))
                self.assertEqual(result['status'],'EXPERIMENTAL_SYNTHETIC')
                self.assertIsNone(result['confidence']);self.assertFalse(result['real_world_validated'])
                predictions.append(result['risk_prediction'])
        classes=json.loads((BASE/'local-classifier.json').read_text(encoding='utf8'))['classes']
        expected=json.loads((BASE/'metrics.json').read_text(encoding='utf8'))['metrics']['test']['confusion_matrix']
        self.assertEqual(confusion_matrix([r['label'] for r in test],predictions,labels=classes).tolist(),expected)

    def test_api_keeps_rule_alerts_and_classifier_separate(self):
        from fastapi.testclient import TestClient
        from main import app
        with patch.dict(os.environ,self.env):
            client=TestClient(app)
            self.assertEqual(client.get('/api/v1/nlp/status').json()['risk_classifier'],'EXPERIMENTAL_SYNTHETIC')
            r=client.post('/api/v1/nlp/report',json={'content':'Chưa tích hợp được API, cần người hướng dẫn giúp xử lý quyền truy cập.','criteria':'','engine':'tfidf','total_tasks':5,'done_tasks':1,'overdue_tasks':2})
            self.assertEqual(r.status_code,200)
            data=r.json();self.assertEqual(data['rule_alert_level'],'review')
            self.assertEqual(data['classifier']['status'],'EXPERIMENTAL_SYNTHETIC')
            self.assertIsNone(data['classifier']['confidence'])

if __name__=='__main__':
    unittest.main()
