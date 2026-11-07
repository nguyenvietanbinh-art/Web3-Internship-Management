import unittest
from evaluation.build_cv_reference import build,judge,PROVENANCE
from evaluation.evaluate_cv_reference import metrics_for
from nlp.metrics import validate_dataset

class CvReferenceTests(unittest.TestCase):
    def test_counts_reproducibility_and_pair_integrity(self):
        cvs,jobs,rows=build()
        self.assertEqual((len(cvs),len(jobs),len(rows)),(200,20,4000))
        self.assertEqual(build(),(cvs,jobs,rows))
        self.assertEqual(len({r['text'] for r in cvs}),200)
        self.assertTrue(all(r['human_confirmed'] is False and not r['verified_ability'] for r in rows))
        self.assertTrue(all(r==judge(next(c for c in cvs if c['id']==r['cv_id']),next(j for j in jobs if j['id']==r['jd_id'])) for r in rows))

    def test_family_isolation_and_no_score_in_model_input(self):
        cvs,_,_=build();groups={}
        for cv in cvs:
            groups.setdefault(cv['group_id'],set()).add(cv['split'])
            self.assertNotIn('reference_score',cv['text'])
        self.assertTrue(all(len(s)==1 for s in groups.values()))
        self.assertEqual(sum(c['split']=='test' for c in cvs),40)

    def test_metrics_require_full_pool_and_grade_two_for_relevance(self):
        labels={'a':{'grade':3},'b':{'grade':1},'c':{'grade':2},'d':{'grade':0}}
        result=metrics_for(['a','b','c','d'],labels,2)
        self.assertEqual(result['precision_at_k'],.5)
        self.assertEqual(result['recall_at_k'],.5)
        self.assertAlmostEqual(result['average_precision'],(1+2/3)/2)
        self.assertIsNone(metrics_for(['a'],{'a':{'grade':1}},1))
        with self.assertRaises(ValueError):metrics_for(['a','b'],labels,2)
        with self.assertRaises(ValueError):metrics_for(['a','a','c','d'],labels,2)

    def test_cannot_misrepresent_reference_as_independent_expert(self):
        with self.assertRaises(ValueError):validate_dataset({'provenance':PROVENANCE})

if __name__=='__main__':unittest.main()
