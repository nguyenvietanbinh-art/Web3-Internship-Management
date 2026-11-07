import math
import unittest
from unittest.mock import patch
import numpy as np
from nlp.engine import rank,skills,encoder
from nlp.schemas import RankingRequest

class SemanticRankingTests(unittest.TestCase):
    def test_controlled_aliases_match_backend_catalog(self):
        self.assertEqual(skills(['JS','NodeJS','RESTful API']),['javascript','node.js','rest api'])

    def test_real_tfidf_duplicate_and_unrelated_documents(self):
        req=RankingRequest(query={'id':'cv','text':'JavaScript React giao diện web','skills':['JS']},candidates=[{'id':'same-a','text':'JavaScript React giao diện web','skills':['JavaScript']},{'id':'same-b','text':'JavaScript React giao diện web','skills':['JavaScript']},{'id':'other','text':'Kế toán tài chính thuế','skills':[]}],engine='tfidf',top_k=3)
        a,b=rank(req),rank(req)
        self.assertEqual(a['results'],b['results']);self.assertEqual(a['results'][0]['id'],'same-a');self.assertEqual(a['results'][0]['raw_cosine'],a['results'][1]['raw_cosine']);self.assertGreater(a['results'][0]['raw_cosine'],a['results'][2]['raw_cosine'])

    def test_precision_tie_uses_raw_score_with_explicit_synthetic_embedding_unit_fixture(self):
        # Tests sorting only; these vectors are NOT model inference or quality evidence.
        vectors=np.array([[1.,0.],[.80000041,math.sqrt(1-.80000041**2)],[.80000049,math.sqrt(1-.80000049**2)]])
        req=RankingRequest(query={'id':'q','text':'query'},candidates=[{'id':'a-low','text':'first'},{'id':'z-high','text':'second'}],engine='sbert',top_k=2)
        with patch.object(encoder,'encode',return_value=(vectors,[None,None,None])):
            result=rank(req)
        self.assertEqual(result['results'][0]['id'],'z-high');self.assertEqual(result['results'][0]['cosine'],result['results'][1]['cosine']);self.assertGreater(result['results'][0]['raw_cosine'],result['results'][1]['raw_cosine'])

    def test_empty_query_and_duplicate_mapping_fail(self):
        with self.assertRaises(ValueError):rank(RankingRequest(query={'id':'q','text':'  '},candidates=[],engine='tfidf'))
        with self.assertRaises(ValueError):rank(RankingRequest(query={'id':'q','text':'React'},candidates=[{'id':'same','text':'React'},{'id':'same','text':'Java'}],engine='tfidf'))

    def test_full_scores_for_comparison_do_not_change_top_k_contract(self):
        req=RankingRequest(query={'id':'q','text':'React JavaScript'},candidates=[{'id':str(i),'text':'React '+str(i)} for i in range(25)],engine='tfidf',top_k=5,include_all_scores=True)
        result=rank(req)
        self.assertEqual(len(result['results']),5);self.assertEqual(len(result['all_results']),25)
        self.assertEqual(result['results'],result['all_results'][:5])

if __name__=='__main__':unittest.main()
