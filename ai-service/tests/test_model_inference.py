"""Opt-in actual pinned ONNX inference; synthetic smoke, never labeled quality metrics."""
import os
import unittest
import numpy as np
from nlp.engine import encoder,rank,MODEL_REVISION
from nlp.schemas import RankingRequest,ReportRequest
from nlp.risk import analyze

class RealModelTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if os.environ.get('NLP_INFERENCE_TESTS')!='true':
            raise unittest.SkipTest('Actual model inference must be explicitly enabled with approved artifacts and sufficient RAM')
        encoder.load()

    def test_actual_multilingual_embeddings_and_normalization(self):
        texts=['Sinh viên lập trình React và hợp đồng thông minh Solidity.','React developer and Solidity smart contracts.','Kế toán báo cáo tài chính và thuế.']
        vectors,_=encoder.encode(texts)
        self.assertEqual(vectors.shape,(3,384));self.assertTrue(np.isfinite(vectors).all())
        np.testing.assert_allclose(np.linalg.norm(vectors,axis=1),np.ones(3),atol=1e-5)
        self.assertGreater(float(vectors[0]@vectors[1]),float(vectors[0]@vectors[2]))

    def test_real_tokenizer_special_template_and_full_token_count(self):
        self.assertEqual(encoder.tokenizer.encode('',add_special_tokens=True).ids,[0,2])
        tokens=encoder.tokenizer.encode('Lập trình React Solidity. '*500,add_special_tokens=False).ids
        self.assertGreater(len(tokens),1008)

    def test_long_text_chunk_limit_and_explicit_truncation(self):
        text='Lập trình React Solidity. '*500
        vectors,coverage=encoder.encode([text])
        self.assertTrue(np.isfinite(vectors).all());self.assertEqual(coverage[0]['chunks'],8)
        self.assertEqual(coverage[0]['used_tokens'],1008);self.assertGreater(coverage[0]['total_tokens'],1008);self.assertTrue(coverage[0]['truncated'])

    def test_actual_cosine_rank_topk_tie_and_revision(self):
        r=rank(RankingRequest(query={'id':'q','text':'React Solidity developer'},candidates=[{'id':'z','text':'React Solidity developer'},{'id':'a','text':'React Solidity developer'},{'id':'other','text':'Kế toán tài chính'}],engine='sbert',top_k=1))
        self.assertEqual(r['results'][0]['id'],'a');self.assertAlmostEqual(r['results'][0]['cosine'],1,places=5)
        self.assertTrue(r['model']['ready']);self.assertEqual(r['model']['revision'],MODEL_REVISION);self.assertIsNone(r['confidence'])

    def test_semantic_report_is_real_model_not_risk_classifier(self):
        r=analyze(ReportRequest(content='Đã lập trình React và hợp đồng Solidity.',criteria='React Solidity',engine='sbert',total_tasks=1,overdue_tasks=1))
        self.assertEqual(r['semantic_relevance']['engine'],'sbert');self.assertTrue(r['semantic_relevance']['model']['ready'])
        self.assertEqual(r['classifier']['status'],'NOT_TRAINED');self.assertIsNone(r['classifier']['risk_prediction']);self.assertIsNone(r['classifier']['confidence'])

    def test_cache_reuses_actual_vectors_without_raw_text_keys(self):
        text='SYNTHETIC private-cache test React Solidity.'
        first,_=encoder.encode([text]);keys=set(encoder.cache);second,_=encoder.encode([text])
        np.testing.assert_array_equal(first,second);self.assertEqual(set(encoder.cache),keys)
        self.assertNotIn(text,encoder.cache);self.assertTrue(all(len(k)==64 for k in keys))
